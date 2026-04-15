import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import * as net from 'net'
import * as tls from 'tls'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── SMTP nativo (reutilizado de teste.ts) ─────────────────────────────────────
function smtpCommand(socket: net.Socket | tls.TLSSocket, cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let response = ''
    const onData = (data: Buffer) => {
      response += data.toString()
      if (/^\d{3} /m.test(response)) {
        socket.removeListener('data', onData)
        socket.removeListener('error', onErr)
        resolve(response)
      }
    }
    const onErr = (err: Error) => { socket.removeListener('data', onData); reject(err) }
    socket.on('data', onData)
    socket.once('error', onErr)
    if (cmd) socket.write(cmd + '\r\n')
  })
}

function waitGreeting(socket: net.Socket): Promise<string> {
  return smtpCommand(socket, '')
}

async function smtpAuth(socket: net.Socket | tls.TLSSocket, user: string, password: string) {
  const r1 = await smtpCommand(socket, 'AUTH LOGIN')
  if (!r1.startsWith('3') && !r1.startsWith('2')) throw new Error(`AUTH LOGIN falhou: ${r1.trim()}`)
  const r2 = await smtpCommand(socket, Buffer.from(user).toString('base64'))
  if (!r2.startsWith('3') && !r2.startsWith('2')) throw new Error(`Usuário SMTP rejeitado`)
  const r3 = await smtpCommand(socket, Buffer.from(password).toString('base64'))
  if (!r3.startsWith('2')) throw new Error(`Senha SMTP rejeitada (use Senha de App para Gmail)`)
}

async function smtpSendOne(
  socket: net.Socket | tls.TLSSocket,
  from: string, to: string, subject: string, html: string
) {
  const body = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
    '',
  ].join('\r\n')

  const r1 = await smtpCommand(socket, `MAIL FROM:<${from.match(/<(.+)>/)?.[1] ?? from}>`)
  if (!r1.startsWith('2')) throw new Error(`MAIL FROM rejeitado: ${r1.trim()}`)
  const r2 = await smtpCommand(socket, `RCPT TO:<${to}>`)
  if (!r2.startsWith('2')) throw new Error(`Destinatário ${to} rejeitado: ${r2.trim()}`)
  const r3 = await smtpCommand(socket, 'DATA')
  if (!r3.startsWith('3')) throw new Error(`DATA falhou: ${r3.trim()}`)
  const r4 = await smtpCommand(socket, body + '\r\n.')
  if (!r4.startsWith('2')) throw new Error(`Mensagem rejeitada: ${r4.trim()}`)
}

async function sendViaSmtp(cfg: any, recipients: string[], subject: string, html: string) {
  const host = cfg.host
  const port = Number(cfg.port) || 587
  const fromDisplay = `"${cfg.from_name || 'Boletim Inteligente'}" <${cfg.from_email}>`

  return new Promise<void>((resolve, reject) => {
    const plainSocket = net.createConnection({ host, port }, async () => {
      try {
        await waitGreeting(plainSocket)
        const ehlo1 = await smtpCommand(plainSocket, 'EHLO boletim-inteligente')
        if (!ehlo1.startsWith('2')) throw new Error(`EHLO falhou: ${ehlo1.trim()}`)

        if (port !== 465) {
          const stls = await smtpCommand(plainSocket, 'STARTTLS')
          if (!stls.startsWith('2')) throw new Error(`STARTTLS falhou: ${stls.trim()}`)

          const tlsSocket = tls.connect({ socket: plainSocket as any, servername: host }, async () => {
            try {
              await smtpCommand(tlsSocket, 'EHLO boletim-inteligente')
              await smtpAuth(tlsSocket, cfg.user, cfg.password)
              for (const to of recipients) {
                await smtpSendOne(tlsSocket, fromDisplay, to, subject, html)
              }
              tlsSocket.write('QUIT\r\n')
              resolve()
            } catch (e) { reject(e) }
          })
          tlsSocket.on('error', reject)
          return
        }

        await smtpAuth(plainSocket, cfg.user, cfg.password)
        for (const to of recipients) {
          await smtpSendOne(plainSocket, fromDisplay, to, subject, html)
        }
        plainSocket.write('QUIT\r\n')
        resolve()
      } catch (e) { plainSocket.destroy(); reject(e) }
    })
    plainSocket.on('error', reject)
    plainSocket.setTimeout(20000, () => { plainSocket.destroy(); reject(new Error('Timeout SMTP')) })
  })
}

async function sendViaResend(cfg: any, recipients: string[], subject: string, html: string) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${cfg.from_name || 'Boletim Inteligente'} <${cfg.from_email}>`,
      to: recipients,
      subject,
      html,
    }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(`Resend API: ${err.message || resp.statusText}`)
  }
}

async function sendViaSendGrid(cfg: any, recipients: string[], subject: string, html: string) {
  const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: recipients.map(email => ({ email })) }],
      from: { email: cfg.from_email, name: cfg.from_name || 'Boletim Inteligente' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(`SendGrid: ${JSON.stringify(err.errors || resp.statusText)}`)
  }
}

function buildEmailHtml(boletim: any): string {
  const conteudo = (boletim.conteudo || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:620px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#0077B6,#00B4D8);padding:24px 32px">
      <h1 style="color:white;margin:0;font-size:22px">${boletim.title || 'Boletim'}</h1>
      ${boletim.grupo?.name ? `<p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px">Grupo: ${boletim.grupo.name}</p>` : ''}
    </div>
    <div style="padding:24px 32px;line-height:1.7;color:#333;font-size:15px;white-space:pre-wrap">
      ${conteudo}
    </div>
    <div style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">
      Boletim Inteligente · Esta mensagem foi enviada automaticamente, não responda.
    </div>
  </div>
</body>
</html>`
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { boletim_id } = req.body
  if (!boletim_id) return res.status(400).json({ error: 'boletim_id é obrigatório' })

  // 1. Buscar boletim com grupo e membros
  const { data: boletim, error: bErr } = await supabase
    .from('boletins')
    .select(`
      id, title, conteudo, status, canais_envio, grupo_id,
      grupo:grupos(id, name, members:grupo_membros(id, name, contact, email))
    `)
    .eq('id', boletim_id)
    .single()

  if (bErr || !boletim) return res.status(404).json({ error: 'Boletim não encontrado' })
  if (boletim.status !== 'aprovado') return res.status(400).json({ error: 'Apenas boletins com status "aprovado" podem ser enviados' })

  const canais: string[] = boletim.canais_envio || []
  if (canais.length === 0) return res.status(400).json({ error: 'Nenhum canal de envio configurado neste boletim' })

  const members: any[] = boletim.grupo?.members || []
  const resultados: { canal: string; enviados: number; erros: string[] }[] = []

  // 2. Para cada canal configurado no boletim
  for (const canal of canais) {
    const { data: canalCfg } = await supabase
      .from('canal_envio_config')
      .select('*')
      .eq('canal', canal)
      .maybeSingle()

    if (!canalCfg || !canalCfg.ativo) {
      resultados.push({ canal, enviados: 0, erros: [`Canal ${canal} inativo ou não configurado`] })
      continue
    }

    const cfg = canalCfg.config || {}

    if (canal === 'email') {
      // Coletar e-mails válidos dos membros
      const emails = members
        .map((m: any) => m.email?.trim())
        .filter((e: string | undefined): e is string => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))

      if (emails.length === 0) {
        resultados.push({ canal, enviados: 0, erros: ['Nenhum membro com e-mail cadastrado no grupo'] })
        continue
      }

      const subject = boletim.title || 'Boletim'
      const html = buildEmailHtml(boletim)
      const erros: string[] = []
      let enviados = 0

      const provider = cfg.provider || 'smtp'

      try {
        if (provider === 'resend') {
          await sendViaResend(cfg, emails, subject, html)
          enviados = emails.length
        } else if (provider === 'sendgrid') {
          await sendViaSendGrid(cfg, emails, subject, html)
          enviados = emails.length
        } else {
          // SMTP — envia um a um para capturar erros individuais
          await sendViaSmtp(cfg, emails, subject, html)
          enviados = emails.length
        }
      } catch (e: any) {
        erros.push(e.message || 'Erro desconhecido ao enviar e-mail')
      }

      resultados.push({ canal, enviados, erros })
    }

    if (canal === 'whatsapp') {
      // Coletar telefones dos membros
      const phones = members
        .map((m: any) => m.contact?.replace(/\D/g, ''))
        .filter((p: string | undefined): p is string => !!p && p.length >= 10)

      if (phones.length === 0) {
        resultados.push({ canal, enviados: 0, erros: ['Nenhum membro com telefone cadastrado no grupo'] })
        continue
      }

      const provider = cfg.provider || 'evolution'
      const texto = `*${boletim.title}*\n\n${boletim.conteudo}`
      let enviados = 0
      const erros: string[] = []

      for (const phone of phones) {
        try {
          if (provider === 'evolution') {
            const url = `${cfg.api_url?.replace(/\/$/, '')}/message/sendText/${cfg.instance}`
            const resp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': cfg.api_token },
              body: JSON.stringify({ number: `55${phone}`, text: texto }),
            })
            if (!resp.ok) throw new Error(`Evolution API error: ${resp.status}`)
            enviados++
          } else if (provider === 'twilio') {
            const resp = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${cfg.account_sid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${Buffer.from(`${cfg.account_sid}:${cfg.auth_token}`).toString('base64')}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  From: `whatsapp:${cfg.from_phone}`,
                  To: `whatsapp:+55${phone}`,
                  Body: texto,
                }).toString(),
              }
            )
            if (!resp.ok) throw new Error(`Twilio error: ${resp.status}`)
            enviados++
          }
        } catch (e: any) {
          erros.push(`+55${phone}: ${e.message}`)
        }
      }

      resultados.push({ canal, enviados, erros })
    }
  }

  // 3. Marcar boletim como enviado
  const todosErros = resultados.flatMap(r => r.erros)
  const totalEnviados = resultados.reduce((s, r) => s + r.enviados, 0)

  await supabase
    .from('boletins')
    .update({ status: 'enviado', data_envio: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', boletim_id)

  return res.status(200).json({
    ok: true,
    resultados,
    total_enviados: totalEnviados,
    avisos: todosErros.length > 0 ? todosErros : undefined,
  })
}
