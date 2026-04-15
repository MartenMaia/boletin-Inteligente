import React, { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Box, Typography, Paper, Tabs, Tab, Divider, TextField,
  MenuItem, Alert, Chip, Grid, Skeleton, Button, Switch,
  FormControlLabel, CircularProgress, Snackbar, Tooltip,
  IconButton, InputAdornment, Collapse,
} from '@mui/material'
import WaterIcon         from '@mui/icons-material/Water'
import SecurityIcon      from '@mui/icons-material/Security'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import DashboardIcon     from '@mui/icons-material/Dashboard'
import SendIcon          from '@mui/icons-material/Send'
import EmailIcon         from '@mui/icons-material/Email'
import WhatsAppIcon      from '@mui/icons-material/WhatsApp'
import InfoOutlinedIcon  from '@mui/icons-material/InfoOutlined'
import VisibilityIcon    from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import AdminLayout from '../../components/AdminLayout'
import { useAuth }  from '../../hooks/useAuth'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const FLORIPA_BAIRROS = [
  'Abraão','Agronômica','Barra da Lagoa','Campeche','Canasvieiras','Coqueiros',
  'Centro','Córrego Grande','Costeira do Pirajubaé','Daniela','Estreito',
  'Ingleses do Rio Vermelho','Itacorubi','João Paulo','Jurerê','Lagoa da Conceição',
  'Monte Cristo','Pantanal','Pântano do Sul','Ratones','Ribeirão da Ilha',
  'Rio Tavares','Saco Grande','Santa Mônica','Santo Antônio de Lisboa','Trindade',
].sort((a, b) => a.localeCompare(b, 'pt-BR'))

// ── Componente Tooltip de ajuda ──────────────────────────────
function HelpTip({ title }: { title: string }) {
  return (
    <Tooltip title={title} placement="right" arrow
      componentsProps={{ tooltip: { sx: { maxWidth: 320, fontSize: '0.78rem', lineHeight: 1.5 } } }}>
      <IconButton size="small" sx={{ color: 'text.disabled', p: 0.3 }}>
        <InfoOutlinedIcon sx={{ fontSize: 17 }} />
      </IconButton>
    </Tooltip>
  )
}

// ── Campo senha com toggle de visibilidade ───────────────────
function PasswordField({ label, value, onChange, helpText }: {
  label: string; value: string; onChange: (v: string) => void; helpText: string
}) {
  const [show, setShow] = useState(false)
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8 }}>
      <TextField
        label={label} fullWidth type={show ? 'text' : 'password'}
        value={value} onChange={e => onChange(e.target.value)}
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShow(s => !s)}>
                {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <HelpTip title={helpText} />
    </Box>
  )
}

// ── Indicador de status do canal ─────────────────────────────
function CanalStatus({ ativo, configured }: { ativo: boolean; configured: boolean }) {
  if (ativo && configured) return (
    <Chip icon={<CheckCircleIcon />} label="Ativo e configurado" color="success" size="small" sx={{ fontWeight: 600 }} />
  )
  if (configured && !ativo)  return (
    <Chip icon={<RadioButtonUncheckedIcon />} label="Configurado (inativo)" color="default" size="small" />
  )
  return (
    <Chip label="Não configurado" color="warning" size="small" variant="outlined" />
  )
}

// ── Seção de título de campo com tooltip ─────────────────────
function FieldLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">{label}</Typography>
      <HelpTip title={tip} />
    </Box>
  )
}

// ── Tab "Envio" ──────────────────────────────────────────────
function TabEnvio({ profile }: { profile: any }) {
  const { data: configs, isLoading } = useSWR('/api/envio/config', fetcher)

  // ── Estado email ──
  const [emailAtivo,    setEmailAtivo]    = useState(false)
  const [emailProvider, setEmailProvider] = useState('smtp')
  const [emailHost,     setEmailHost]     = useState('')
  const [emailPort,     setEmailPort]     = useState('587')
  const [emailUser,     setEmailUser]     = useState('')
  const [emailPass,     setEmailPass]     = useState('')
  const [emailFromName, setEmailFromName] = useState('')
  const [emailFrom,     setEmailFrom]     = useState('')
  const [emailApiKey,   setEmailApiKey]   = useState('')
  const [savingEmail,   setSavingEmail]   = useState(false)
  const [testEmailTo,   setTestEmailTo]   = useState('')
  const [sendingTest,   setSendingTest]   = useState(false)

  // ── Estado WhatsApp ──
  const [waAtivo,       setWaAtivo]       = useState(false)
  const [waProvider,    setWaProvider]    = useState('evolution')
  const [waUrl,         setWaUrl]         = useState('')
  const [waToken,       setWaToken]       = useState('')
  const [waPhone,       setWaPhone]       = useState('')
  const [waInstance,    setWaInstance]    = useState('')
  const [waAccountSid,  setWaAccountSid]  = useState('')
  const [waAuthToken,   setWaAuthToken]   = useState('')
  const [savingWa,      setSavingWa]      = useState(false)

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })
  const showSnack = (m: string, s: typeof snack.severity = 'success') =>
    setSnack({ open: true, message: m, severity: s })

  // Preencher formulários ao carregar
  useEffect(() => {
    if (!configs) return
    const email = configs.find((c: any) => c.canal === 'email')
    const wa    = configs.find((c: any) => c.canal === 'whatsapp')
    if (email) {
      setEmailAtivo(email.ativo)
      const cfg = email.config || {}
      setEmailProvider(cfg.provider   || 'smtp')
      setEmailHost(    cfg.host       || '')
      setEmailPort(    cfg.port       || '587')
      setEmailUser(    cfg.user       || '')
      setEmailPass(    cfg.password   || '')
      setEmailFromName(cfg.from_name  || '')
      setEmailFrom(    cfg.from_email || '')
      setEmailApiKey(  cfg.api_key    || '')
    }
    if (wa) {
      setWaAtivo(wa.ativo)
      const cfg = wa.config || {}
      setWaProvider(  cfg.provider    || 'evolution')
      setWaUrl(       cfg.api_url     || '')
      setWaToken(     cfg.api_token   || '')
      setWaPhone(     cfg.from_phone  || '')
      setWaInstance(  cfg.instance    || '')
      setWaAccountSid(cfg.account_sid || '')
      setWaAuthToken( cfg.auth_token  || '')
    }
  }, [configs])

  const isEmailConfigured = !!(emailProvider === 'smtp'
    ? emailHost && emailUser && emailFrom
    : emailApiKey && emailFrom)

  const isWaConfigured = !!(waProvider === 'evolution'
    ? waUrl && waToken
    : waProvider === 'twilio'
      ? waAccountSid && waAuthToken && waPhone
      : false)

  // Salvar Email
  const saveEmail = async () => {
    setSavingEmail(true)
    try {
      const config = emailProvider === 'smtp'
        ? { provider: emailProvider, host: emailHost, port: emailPort, user: emailUser, password: emailPass, from_name: emailFromName, from_email: emailFrom }
        : { provider: emailProvider, api_key: emailApiKey, from_name: emailFromName, from_email: emailFrom }

      const res = await fetch('/api/envio/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canal: 'email', ativo: emailAtivo, config, updated_by: profile?.id }),
      })
      if (!res.ok) throw new Error()
      await mutate('/api/envio/config')
      showSnack('Configurações de e-mail salvas!')
    } catch {
      showSnack('Erro ao salvar configurações de e-mail', 'error')
    } finally {
      setSavingEmail(false)
    }
  }

  // Salvar WhatsApp
  const saveWhatsApp = async () => {
    setSavingWa(true)
    try {
      const config = waProvider === 'evolution'
        ? { provider: waProvider, api_url: waUrl, api_token: waToken, from_phone: waPhone, instance: waInstance }
        : waProvider === 'twilio'
          ? { provider: waProvider, account_sid: waAccountSid, auth_token: waAuthToken, from_phone: waPhone }
          : { provider: waProvider }

      const res = await fetch('/api/envio/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canal: 'whatsapp', ativo: waAtivo, config, updated_by: profile?.id }),
      })
      if (!res.ok) throw new Error()
      await mutate('/api/envio/config')
      showSnack('Configurações de WhatsApp salvas!')
    } catch {
      showSnack('Erro ao salvar configurações de WhatsApp', 'error')
    } finally {
      setSavingWa(false)
    }
  }

  if (profile?.role !== 'admin' && profile?.role !== 'suporte') {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <SecurityIcon sx={{ fontSize: 48, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1.5 }} />
        <Typography color="text.secondary" fontWeight={500}>
          Apenas administradores e suporte podem acessar as configurações de envio.
        </Typography>
      </Box>
    )
  }

  if (isLoading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      {[1,2].map(i => <Skeleton key={i} variant="rounded" height={200} />)}
    </Box>
  )

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── E-mail ─────────────────────────────────── */}
        <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          {/* Cabeçalho */}
          <Box sx={{
            px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,119,182,0.04)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EmailIcon sx={{ color: '#0077B6' }} />
              <Box>
                <Typography fontWeight={700}>E-mail</Typography>
                <Typography variant="caption" color="text.secondary">
                  Envio de boletins por e-mail aos destinatários do grupo
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CanalStatus ativo={emailAtivo} configured={isEmailConfigured} />
              <FormControlLabel
                control={<Switch checked={emailAtivo} onChange={e => setEmailAtivo(e.target.checked)} color="primary" />}
                label={emailAtivo ? 'Ativo' : 'Inativo'}
                sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.85rem' } }}
              />
            </Box>
          </Box>
          <Divider />

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Provedor */}
            <Box>
              <FieldLabel label="PROVEDOR DE E-MAIL" tip="Escolha o serviço que será usado para enviar os e-mails. Para SMTP use seu próprio servidor ou Gmail/Outlook. Para SendGrid ou Resend crie uma conta gratuita nos respectivos sites." />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[
                  { value: 'smtp',     label: 'SMTP',     tip: 'Servidor SMTP próprio, Gmail, Outlook, etc.' },
                  { value: 'sendgrid', label: 'SendGrid', tip: 'sendgrid.com — até 100 e-mails/dia grátis' },
                  { value: 'resend',   label: 'Resend',   tip: 'resend.com — 100 e-mails/dia grátis, fácil configuração' },
                ].map(p => (
                  <Box key={p.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={p.label}
                      onClick={() => setEmailProvider(p.value)}
                      variant={emailProvider === p.value ? 'filled' : 'outlined'}
                      color={emailProvider === p.value ? 'primary' : 'default'}
                      clickable sx={{ fontWeight: emailProvider === p.value ? 700 : 400 }}
                    />
                    <HelpTip title={p.tip} />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* SMTP */}
            <Collapse in={emailProvider === 'smtp'}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FieldLabel label="CONFIGURAÇÕES SMTP" tip="Obtenha as credenciais no painel do seu provedor de e-mail. Para Gmail: host=smtp.gmail.com, porta=587, usuário=seu@gmail.com, senha=Senha de App (ative em Conta Google → Segurança → Senhas de app)." />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 2 }}>
                    <TextField label="Host SMTP" size="small" fullWidth value={emailHost}
                      onChange={e => setEmailHost(e.target.value)} placeholder="smtp.gmail.com" />
                    <HelpTip title="Endereço do servidor SMTP. Exemplos: smtp.gmail.com, smtp.sendgrid.net, smtp.office365.com" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 1 }}>
                    <TextField label="Porta" size="small" fullWidth value={emailPort}
                      onChange={e => setEmailPort(e.target.value)} placeholder="587" />
                    <HelpTip title="Porta SMTP: 587 (TLS/STARTTLS — recomendado), 465 (SSL), 25 (sem criptografia — não recomendado)" />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 1 }}>
                    <TextField label="Usuário SMTP" size="small" fullWidth value={emailUser}
                      onChange={e => setEmailUser(e.target.value)} placeholder="seu@email.com" />
                    <HelpTip title="Geralmente é o seu endereço de e-mail completo" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <PasswordField
                      label="Senha SMTP"
                      value={emailPass} onChange={setEmailPass}
                      helpText="Para Gmail use uma Senha de App (não sua senha normal). Acesse: Conta Google → Segurança → Verificação em duas etapas → Senhas de app"
                    />
                  </Box>
                </Box>
              </Box>
            </Collapse>

            {/* SendGrid / Resend API Key */}
            <Collapse in={emailProvider === 'sendgrid' || emailProvider === 'resend'}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FieldLabel
                  label={`API KEY — ${emailProvider === 'sendgrid' ? 'SENDGRID' : 'RESEND'}`}
                  tip={emailProvider === 'sendgrid'
                    ? 'No painel do SendGrid: Settings → API Keys → Create API Key. Permissão mínima: Mail Send.'
                    : 'No painel do Resend: API Keys → Create API Key. A chave começa com "re_".'}
                />
                <PasswordField
                  label="API Key"
                  value={emailApiKey} onChange={setEmailApiKey}
                  helpText={emailProvider === 'sendgrid'
                    ? 'Chave gerada em app.sendgrid.com → Settings → API Keys. Começa com "SG."'
                    : 'Chave gerada em resend.com → API Keys. Começa com "re_"'}
                />
              </Box>
            </Collapse>

            {/* Remetente — sempre visível */}
            <Box>
              <FieldLabel label="REMETENTE" tip="Nome e endereço que os destinatários verão ao receber o e-mail. Use um domínio verificado no seu provedor para evitar que os e-mails caiam no spam." />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 1 }}>
                  <TextField label="Nome do remetente" size="small" fullWidth value={emailFromName}
                    onChange={e => setEmailFromName(e.target.value)} placeholder="Boletim Inteligente" />
                  <HelpTip title='Nome que aparecerá no campo "De:" do e-mail. Ex: "Prefeitura de Florianópolis"' />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 1 }}>
                  <TextField label="E-mail remetente" size="small" fullWidth value={emailFrom}
                    onChange={e => setEmailFrom(e.target.value)} placeholder="boletim@seudominio.com.br" />
                  <HelpTip title="E-mail remetente verificado no seu provedor. Deve corresponder ao domínio autenticado (SPF/DKIM) para boa entregabilidade." />
                </Box>
              </Box>
            </Box>

            {/* Teste de envio */}
            <Box>
              <FieldLabel label="TESTE DE ENVIO" tip="Envie um e-mail de teste para verificar se as configurações estão corretas. Use seu próprio e-mail para confirmar o recebimento." />
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <TextField
                  label="E-mail de destino para o teste"
                  size="small"
                  value={testEmailTo}
                  onChange={e => setTestEmailTo(e.target.value)}
                  placeholder="seu@email.com"
                  sx={{ flex: 1 }}
                  type="email"
                  disabled={sendingTest}
                />
                <Button
                  variant="outlined"
                  onClick={async () => {
                    if (!testEmailTo.trim()) { showSnack('Informe o e-mail de destino', 'error'); return }
                    setSendingTest(true)
                    try {
                      const res = await fetch('/api/envio/teste', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ destinatario: testEmailTo }),
                      })
                      const data = await res.json()
                      if (!res.ok) {
                        const msg = data.dica ? `${data.error}\n\n💡 ${data.dica}` : (data.error || 'Erro ao enviar')
                        showSnack(msg, 'error')
                      } else {
                        showSnack(data.mensagem || 'E-mail de teste enviado!', 'success')
                      }
                    } catch {
                      showSnack('Erro de conexão ao tentar enviar o teste', 'error')
                    } finally {
                      setSendingTest(false)
                    }
                  }}
                  disabled={sendingTest || !testEmailTo.trim()}
                  startIcon={sendingTest ? <CircularProgress size={16} /> : <SendIcon />}
                  sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  {sendingTest ? 'Enviando…' : 'Enviar teste'}
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={saveEmail} disabled={savingEmail}
                startIcon={savingEmail ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
                sx={{ background: 'linear-gradient(135deg, #0077B6, #00B4D8)', textTransform: 'none' }}>
                Salvar configurações de e-mail
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* ── WhatsApp ───────────────────────────────── */}
        <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          {/* Cabeçalho */}
          <Box sx={{
            px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(37,211,102,0.04)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <WhatsAppIcon sx={{ color: '#25D366' }} />
              <Box>
                <Typography fontWeight={700}>WhatsApp</Typography>
                <Typography variant="caption" color="text.secondary">
                  Envio de boletins via mensagem WhatsApp para os destinatários do grupo
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CanalStatus ativo={waAtivo} configured={isWaConfigured} />
              <FormControlLabel
                control={<Switch checked={waAtivo} onChange={e => setWaAtivo(e.target.checked)} color="success" />}
                label={waAtivo ? 'Ativo' : 'Inativo'}
                sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.85rem' } }}
              />
            </Box>
          </Box>
          <Divider />

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Provedor */}
            <Box>
              <FieldLabel label="PROVEDOR WHATSAPP" tip="Escolha a plataforma que fará a integração com o WhatsApp. Cada uma tem requisitos diferentes — veja os tooltips individuais." />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { value: 'evolution', label: 'Evolution API', tip: 'Solução open-source auto-hospedada. Gratuita, sem limite de mensagens. Requer VPS/servidor próprio.' },
                  { value: 'twilio',    label: 'Twilio',        tip: 'twilio.com/whatsapp — plataforma paga com plano sandbox gratuito. Mais simples de configurar, sem servidor próprio.' },
                  { value: 'meta',      label: 'Meta Business', tip: 'API oficial do WhatsApp Business (business.whatsapp.com). Requer conta verificada e aprovação da Meta.' },
                ].map(p => (
                  <Box key={p.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={p.label}
                      onClick={() => setWaProvider(p.value)}
                      variant={waProvider === p.value ? 'filled' : 'outlined'}
                      color={waProvider === p.value ? 'success' : 'default'}
                      clickable sx={{ fontWeight: waProvider === p.value ? 700 : 400 }}
                    />
                    <HelpTip title={p.tip} />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Evolution API */}
            <Collapse in={waProvider === 'evolution'}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FieldLabel label="EVOLUTION API" tip="Instale o Evolution API em seu servidor (Docker ou Node.js). Documentação em: github.com/EvolutionAPI/evolution-api. Após instalar, crie uma instância e conecte seu número via QR Code." />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 2 }}>
                    <TextField label="URL da instância" size="small" fullWidth value={waUrl}
                      onChange={e => setWaUrl(e.target.value)} placeholder="https://evolution.seudominio.com.br" />
                    <HelpTip title="URL pública onde o Evolution API está instalado. Ex: https://evolution.meuservidor.com.br" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 1.5 }}>
                    <TextField label="Nome da instância" size="small" fullWidth value={waInstance}
                      onChange={e => setWaInstance(e.target.value)} placeholder="boletim" />
                    <HelpTip title="Nome da instância criada no Evolution API. Defina ao criar a instância pelo painel ou API." />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <PasswordField
                      label="API Key (Global Key)"
                      value={waToken} onChange={setWaToken}
                      helpText="Chave global do Evolution API. Definida na variável de ambiente AUTHENTICATION_API_KEY ao instalar." />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 1 }}>
                    <TextField label="Número remetente" size="small" fullWidth value={waPhone}
                      onChange={e => setWaPhone(e.target.value)} placeholder="+5548999999999" />
                    <HelpTip title="Número de WhatsApp conectado à instância, no formato internacional. Ex: +5548999999999" />
                  </Box>
                </Box>
              </Box>
            </Collapse>

            {/* Twilio */}
            <Collapse in={waProvider === 'twilio'}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FieldLabel label="TWILIO WHATSAPP" tip="No painel do Twilio (twilio.com), vá em Messaging → Try it out → Send a WhatsApp message para o sandbox, ou configure um número Business aprovado. Account SID e Auth Token estão na página inicial do console." />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 1 }}>
                    <TextField label="Account SID" size="small" fullWidth value={waAccountSid}
                      onChange={e => setWaAccountSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxx" />
                    <HelpTip title="Encontrado em: console.twilio.com → Account Info → Account SID. Começa com 'AC'." />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <PasswordField
                      label="Auth Token"
                      value={waAuthToken} onChange={setWaAuthToken}
                      helpText="Encontrado em: console.twilio.com → Account Info → Auth Token (clique para revelar)." />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, flex: 1 }}>
                    <TextField label="Número WhatsApp Twilio" size="small" fullWidth value={waPhone}
                      onChange={e => setWaPhone(e.target.value)} placeholder="+14155238886" />
                    <HelpTip title="Número do WhatsApp Twilio (sandbox: +14155238886). Para número próprio, use o aprovado no Sender Registration." />
                  </Box>
                </Box>
              </Box>
            </Collapse>

            {/* Meta */}
            <Collapse in={waProvider === 'meta'}>
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Alert severity="info" sx={{ borderRadius: 2, textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>API Oficial do WhatsApp Business (Meta)</Typography>
                  <Typography variant="body2">
                    Requer conta verificada no Meta Business Manager e aprovação do número.
                    O suporte a esta integração está em desenvolvimento.
                  </Typography>
                  <Chip label="Em breve" color="info" size="small" sx={{ mt: 1 }} />
                </Alert>
              </Box>
            </Collapse>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={saveWhatsApp} disabled={savingWa || waProvider === 'meta'}
                startIcon={savingWa ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
                sx={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', textTransform: 'none' }}>
                Salvar configurações de WhatsApp
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Nota sobre produção */}
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>Atenção:</strong> As configurações de envio (senhas, tokens e API keys) são armazenadas
            no banco de dados. Para maior segurança em produção, considere usar variáveis de ambiente no servidor
            e criptografia adicional para dados sensíveis.
          </Typography>
        </Alert>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </>
  )
}

// ────────────────────────────────────────────────────────────
// Página principal de Configurações
// ────────────────────────────────────────────────────────────
export default function Settings() {
  const { profile } = useAuth()
  const [tab, setTab] = useState(0)
  const [bairro, setBairro]           = useState('Todos')
  const [bairrosList, setBairrosList] = useState<string[]>(['Todos', ...FLORIPA_BAIRROS])
  const [bairrosError, setBairrosError] = useState(false)

  useEffect(() => {
    fetch('/api/bairros')
      .then(r => r.json())
      .then((data: any[]) => {
        const names = [...new Set(data.map(b => b.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
        if (names.length) setBairrosList(['Todos', ...names])
      })
      .catch(() => setBairrosError(true))
  }, [])

  // Tabs: a aba "Envio" só aparece para admins
  const TABS = [
    { label: 'Resumo Geral',  icon: <DashboardIcon     sx={{ fontSize: 18 }} /> },
    { label: 'Balneabilidade',icon: <WaterIcon          sx={{ fontSize: 18 }} /> },
    { label: 'Segurança',     icon: <SecurityIcon       sx={{ fontSize: 18 }} /> },
    { label: 'Movimentação',  icon: <DirectionsCarIcon  sx={{ fontSize: 18 }} /> },
    ...(profile?.role === 'admin' || profile?.role === 'suporte'
      ? [{ label: 'Envio', icon: <SendIcon sx={{ fontSize: 18 }} /> }]
      : []
    ),
  ]

  function ComingSoon({ label }: { label: string }) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.disabled" gutterBottom>{label}</Typography>
        <Chip label="Em breve" variant="outlined" color="info" />
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          Esta seção está sendo desenvolvida.
        </Typography>
      </Box>
    )
  }

  // Índice real da aba "Envio" (pode variar se admin ou não)
  const envioTabIndex = (profile?.role === 'admin' || profile?.role === 'suporte') ? 4 : -1

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Configurações</Typography>
          <Typography variant="body2" color="text.secondary">
            Indicadores por bairro e canais de envio de boletins
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          {/* Tabs */}
          <Box sx={{ px: 3, pt: 1 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 } }}
            >
              {TABS.map((t, i) => (
                <Tab key={i} label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    {t.icon}{t.label}
                  </Box>
                } />
              ))}
            </Tabs>
          </Box>
          <Divider />

          {/* Filtros globais (oculto na aba Envio) */}
          {tab !== envioTabIndex && (
            <>
              <Box sx={{ px: 3, py: 2.5, display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                <TextField select label="Cidade" value="Florianópolis" size="small" sx={{ width: 200 }}>
                  <MenuItem value="Florianópolis">Florianópolis</MenuItem>
                </TextField>
                <TextField select label="Bairro" value={bairro}
                  onChange={(e) => setBairro(e.target.value)} size="small" sx={{ width: 220 }}>
                  {bairrosList.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </TextField>
                {bairrosError && (
                  <Typography variant="caption" color="text.secondary">⚠️ Usando lista local</Typography>
                )}
              </Box>
              <Divider />
            </>
          )}

          <Box sx={{ p: 3 }}>
            {tab === 0 && (
              <Grid container spacing={3}>
                {[
                  { label: 'Boletins enviados hoje',  value: '—',              color: '#0077B6' },
                  { label: 'Bairros monitorados',     value: bairrosList.length - 1, color: '#7B2D8B' },
                  { label: 'Alertas ativos',          value: '—',              color: '#B45309' },
                  { label: 'Última atualização',      value: 'Agora',          color: '#1B8A4A' },
                ].map((stat) => (
                  <Grid item xs={12} sm={6} md={3} key={stat.label}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>{stat.value}</Typography>
                    </Paper>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Filtro ativo: <strong>Florianópolis — {bairro}</strong>.
                    As demais abas exibirão dados filtrados por este recorte quando implementadas.
                  </Alert>
                </Grid>
              </Grid>
            )}
            {tab === 1 && <ComingSoon label="Balneabilidade" />}
            {tab === 2 && <ComingSoon label="Segurança" />}
            {tab === 3 && <ComingSoon label="Movimentação" />}
            {tab === envioTabIndex && envioTabIndex >= 0 && <TabEnvio profile={profile} />}
          </Box>
        </Paper>
      </Box>
    </AdminLayout>
  )
}
