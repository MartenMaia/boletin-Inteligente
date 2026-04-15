import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import * as net from 'net'
import * as tls from 'tls'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── SMTP client simples com net/tls nativos ──────────────────────────────────
function smtpCommand(socket: net.Socket | tls.TLSSocket, cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let response = ''
    const onData = (data: Buffer) => {
      response += data.toString()
      // SMTP responses end when a line matches /^\d{3} /m (no dash continuation)
      if (/^\d{3} /m.test(response)) {
        socket.removeListener('data', onData)
        socket.removeListener('error', onErr)
        resolve(response)
      }
    }
    const onErr = (err: Error) => {
      socket.removeListener('data', onData)
      reject(err)
    }
    socket.on('data', onData)
    socket.once('error', onErr)
    if (cmd) socket.write(cmd + '\r\n')
  })
}

function waitGreeting(socket: net.Socket): Promise<string> {
  return smtpCommand(socket, '')
}

async function sendTestEmail(cfg: {
  host: string; port: number; user: string; password: string
  fromEmail: string; fromName: string; toEmail: string
}) {
  const { host, port, user, password, fromEmail, fromName, toEmail } = cfg

  const emailBody = [
    `From: "${fromName}" <${fromEmail}>`,
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from('Teste de E-mail — Boletim Inteligente').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    '<p>Este é um e-mail de teste enviado pelo <strong>Boletim Inteligente</strong>.</p>',
    '<p>Se você está lendo isto, a configuração de e-mail está funcionando corretamente! ✅</p>',
    '',
  ].join('\r\n')

  return new Promise<void>((resolve, reject) => {
    // Conectar na porta SMTP (587 = STARTTLS, 465 = SSL)
    const plainSocket = net.createConnection({ host, port }, async () => {
      try {
        // Greeting
        await waitGreeting(plainSocket)

        // EHLO
        const ehloResp = await smtpCommand(plainSocket, `EHLO boletim-inteligente`)
        if (!ehloResp.startsWith('2')) throw new Error(`EHLO falhou: ${ehloResp.trim()}`)

        // STARTTLS se porta != 465
        if (port !== 465) {
          const startTlsResp = await smtpCommand(plainSocket, 'STARTTLS')
          if (!startTlsResp.startsWith('2')) throw new Error(`STARTTLS falhou: ${startTlsResp.trim()}`)

          // Upgrade para TLS
          const tlsSocket = tls.connect({ socket: plainSocket as any, servername: host }, async () => {
            try {
              await smtpCommand(tlsSocket, `EHLO boletim-inteligente`)
              await auth(tlsSocket, user, password)
              await sendMail(tlsSocket, fromEmail, toEmail, emailBody)
              tlsSocket.write('QUIT\r\n')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
          tlsSocket.on('error', reject)
          return
        }

        await auth(plainSocket, user, password)
        await sendMail(plainSocket, fromEmail, toEmail, emailBody)
        plainSocket.write('QUIT\r\n')
        resolve()
      } catch (e) {
        plainSocket.destroy()
        reject(e)
      }
    })

    plainSocket.on('error', reject)
    plainSocket.setTimeout(15000, () => {
      plainSocket.destroy()
      reject(new Error('Timeout ao conectar ao servidor SMTP'))
    })
  })
}

async function auth(socket: net.Socket | tls.TLSSocket, user: string, password: string) {
  const authResp = await smtpCommand(socket, 'AUTH LOGIN')
  if (!authResp.startsWith('3') && !authResp.startsWith('2')) {
    throw new Error(`AUTH LOGIN falhou: ${authResp.trim()}`)
  }
  const userResp = await smtpCommand(socket, Buffer.from(user).toString('base64'))
  if (!userResp.startsWith('3') && !userResp.startsWith('2')) {
    throw new Error(`Usuário SMTP rejeitado: ${userResp.trim()}`)
  }
  const passResp = await smtpCommand(socket, Buffer.from(password).toString('base64'))
  if (!passResp.startsWith('2')) {
    throw new Error(`Senha SMTP rejeitada (verifique se está usando uma Senha de App): ${passResp.trim()}`)
  }
}

async function sendMail(
  socket: net.Socket | tls.TLSSocket,
  from: string, to: string, body: string
) {
  const mailResp = await smtpCommand(socket, `MAIL FROM:<${from}>`)
  if (!mailResp.startsWith('2')) throw new Error(`MAIL FROM rejeitado: ${mailResp.trim()}`)

  const rcptResp = await smtpCommand(socket, `RCPT TO:<${to}>`)
  if (!rcptResp.startsWith('2')) throw new Error(`Destinatário rejeitado: ${rcptResp.trim()}`)

  const dataResp = await smtpCommand(socket, 'DATA')
  if (!dataResp.startsWith('3')) throw new Error(`DATA falhou: ${dataResp.trim()}`)

  const msgResp = await smtpCommand(socket, body + '\r\n.')
  if (!msgResp.startsWith('2')) throw new Error(`Mensagem rejeitada: ${msgResp.trim()}`)
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { destinatario } = req.body
  if (!destinatario?.trim()) {
    return res.status(400).json({ error: 'Informe o e-mail de destino' })
  }

  // Buscar configuração de e-mail no banco
  const { data: emailConfig, error: cfgError } = await supabase
    .from('canal_envio_config')
    .select('*')
    .eq('canal', 'email')
    .maybeSingle()

  if (cfgError || !emailConfig) {
    return res.status(404).json({ error: 'Configuração de e-mail não encontrada no banco de dados' })
  }

  if (!emailConfig.ativo) {
    return res.status(400).json({ error: 'O canal de e-mail está inativo. Ative-o nas configurações antes de testar.' })
  }

  const cfg = emailConfig.config || {}
  const provider: string = cfg.provider || 'smtp'

  if (provider !== 'smtp') {
    // Para SendGrid/Resend: tentativa via fetch (API REST)
    if (provider === 'resend') {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${cfg.from_name || 'Boletim Inteligente'} <${cfg.from_email}>`,
          to: [destinatario.trim()],
          subject: 'Teste de E-mail — Boletim Inteligente',
          html: '<p>Este é um e-mail de teste enviado pelo <strong>Boletim Inteligente</strong>.</p><p>Se você está lendo isto, a configuração está funcionando! ✅</p>',
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        return res.status(500).json({ error: `Resend API: ${err.message || resp.statusText}` })
      }
      return res.status(200).json({ ok: true, mensagem: `E-mail de teste enviado via Resend para ${destinatario}` })
    }

    if (provider === 'sendgrid') {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: destinatario.trim() }] }],
          from: { email: cfg.from_email, name: cfg.from_name || 'Boletim Inteligente' },
          subject: 'Teste de E-mail — Boletim Inteligente',
          content: [{ type: 'text/html', value: '<p>E-mail de teste do Boletim Inteligente. ✅</p>' }],
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        return res.status(500).json({ error: `SendGrid API: ${JSON.stringify(err.errors || resp.statusText)}` })
      }
      return res.status(200).json({ ok: true, mensagem: `E-mail de teste enviado via SendGrid para ${destinatario}` })
    }

    return res.status(400).json({ error: `Provedor "${provider}" não suportado no teste` })
  }

  // SMTP
  if (!cfg.host || !cfg.user || !cfg.password || !cfg.from_email) {
    return res.status(400).json({
      error: 'Configuração SMTP incompleta. Verifique Host, Usuário, Senha e E-mail remetente nas configurações.',
    })
  }

  try {
    await sendTestEmail({
      host:      cfg.host,
      port:      Number(cfg.port) || 587,
      user:      cfg.user,
      password:  cfg.password,
      fromEmail: cfg.from_email,
      fromName:  cfg.from_name || 'Boletim Inteligente',
      toEmail:   destinatario.trim(),
    })
    return res.status(200).json({ ok: true, mensagem: `E-mail de teste enviado para ${destinatario}` })
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Erro ao enviar e-mail de teste',
      dica: cfg.provider === 'smtp' && cfg.host?.includes('gmail')
        ? 'Para Gmail, use uma Senha de App (não sua senha normal). Acesse: Conta Google → Segurança → Senhas de app.'
        : undefined,
    })
  }
}
