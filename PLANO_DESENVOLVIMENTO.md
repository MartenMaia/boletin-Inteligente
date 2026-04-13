# Plano de Desenvolvimento — Boletim Inteligente
> Branch: `develop` | Criado em: 2026-04-13

---

## Estado Atual (main)

O projeto foi iniciado pela OpenClaw com foco em prototipar as telas principais. O que existe:

- Estrutura Next.js com TypeScript e MUI
- Páginas de admin: dashboard, boletins, grupos, configurações
- Banco de dados local com Prisma + SQLite
- Tema claro/escuro

**Problemas encontrados na base atual:**
- Alterações não commitadas acumuladas
- Schema do banco inconsistente com o código
- Sem integração real com Supabase (usando SQLite local)
- Estilização mista (MUI + Tailwind sem configuração)
- Menu com problemas de organização e estilo
- Funcionalidades incompletas (aprovação, geração, envio de boletins)
- Autenticação hardcoded (admin/admin)

---

## Objetivo do Projeto

> Sistema que gera boletins diários, que devem ser aprovados e enviados para os usuários vinculados a eles.

**Fluxo principal:**
1. Sistema coleta dados/avisos de fontes configuradas
2. Gera um boletim automaticamente (ou manualmente)
3. Boletim entra em fila de revisão/aprovação
4. Após aprovação, é enviado para os grupos de usuários vinculados

---

## Fases de Desenvolvimento

### 🔴 Fase 1 — Fundação (Prioridade Alta)

**Objetivo:** Estabilizar a base técnica antes de avançar em features.

#### 1.1 Banco de Dados — Migrar para Supabase
- [ ] Configurar projeto no Supabase
- [ ] Criar variáveis de ambiente (`.env.local`)
- [ ] Migrar schema Prisma de SQLite para PostgreSQL (Supabase)
- [ ] Testar conexão e queries básicas
- [ ] Remover `prisma/dev.db` do repositório

#### 1.2 Autenticação Real
- [ ] Implementar autenticação com Supabase Auth
- [ ] Substituir login hardcoded por auth real
- [ ] Proteger rotas admin com middleware Next.js
- [ ] Gerenciar sessão via Supabase (não localStorage)

#### 1.3 Organização e Limpeza de Código
- [ ] Remover endpoints duplicados (`/api/grupos` e `/api/groups`)
- [ ] Padronizar nomes de campos no banco e no código
- [ ] Remover imports e código morto
- [ ] Configurar Tailwind corretamente ou remover e usar apenas MUI

---

### 🟡 Fase 2 — Menu e UI/UX (Prioridade Média-Alta)

**Objetivo:** Corrigir o menu e modernizar a interface.

#### 2.1 Correção do Menu
- [ ] Reorganizar itens de navegação com hierarquia clara
- [ ] Corrigir responsividade (mobile-friendly)
- [ ] Adicionar indicador de página ativa
- [ ] Melhorar espaçamento e tipografia do sidebar
- [ ] Implementar menu colapsável

#### 2.2 Melhoria Visual Geral
- [ ] Definir paleta de cores consistente no `theme.ts`
- [ ] Padronizar componentes (cards, botões, tabelas) com MUI
- [ ] Melhorar dashboard com gráficos/métricas visuais
- [ ] Adicionar estados de loading e empty states
- [ ] Melhorar feedback ao usuário (toasts, confirmações)

---

### 🟢 Fase 3 — Funcionalidades Core (Prioridade Média)

**Objetivo:** Implementar o fluxo principal de boletins end-to-end.

#### 3.1 Criação de Boletins
- [ ] Formulário completo de criação de boletim
- [ ] Editor de conteúdo rico (rich text)
- [ ] Seleção de grupo destinatário
- [ ] Agendamento de envio

#### 3.2 Fluxo de Aprovação
- [ ] Página de revisão funcional (visualizar conteúdo do boletim)
- [ ] Botões de aprovar/rejeitar com feedback
- [ ] Notificação ao aprovador (email ou in-app)
- [ ] Histórico de aprovações

#### 3.3 Envio de Boletins
- [ ] Integração com WhatsApp (via API ou Twilio)
- [ ] Integração com Email (via Resend ou SendGrid)
- [ ] Status de entrega por destinatário
- [ ] Logs de envio

---

### 🔵 Fase 4 — Indicadores e Automação (Prioridade Baixa)

**Objetivo:** Adicionar inteligência e automação ao sistema.

#### 4.1 Dashboard de Indicadores
- [ ] Integrar dados reais de Balneabilidade
- [ ] Integrar dados de Segurança
- [ ] Integrar dados de Movimentação
- [ ] Gráficos e visualizações por bairro

#### 4.2 Geração Automática
- [ ] Agendar geração automática de boletins (cron via Supabase Edge Functions)
- [ ] Coletar avisos de fontes externas automaticamente
- [ ] Geração com IA (resumo/redação automática)

---

## Deploy

- **Frontend:** Vercel (conectado ao repositório GitHub)
- **Backend/DB:** Supabase
- **Variáveis de ambiente:** Configurar tanto em `.env.local` quanto no painel da Vercel

---

## Próximos Passos Imediatos (desta sessão)

1. ✅ Branch `develop` criada
2. Corrigir menu (organização e estilização)
3. Melhorar estilização geral do projeto
4. Configurar integração com Supabase
5. Conectar projeto à Vercel para preview de deploy

---

## Estrutura de Branches

```
main        → código estável (OpenClaw baseline)
develop     → desenvolvimento ativo (branch atual)
feature/*   → features isoladas (criar quando necessário)
```
