Boletim Inteligente - MVP (rascunho)

Stack: Next.js + TypeScript + Prisma + SQLite + TailwindCSS

Instruções rápidas (local):

1. Instalar dependências
   npm install

2. Gerar cliente Prisma e migrar
   npx prisma generate
   npx prisma migrate dev --name init

3. Popular dados de exemplo
   npm run seed

4. Rodar local
   npm run dev

Geração de boletins (manual):
   npm run generate:boletin

APIs:
 - GET /api/bairros
 - POST /api/bairros
 - GET /api/avisos
 - POST /api/avisos
 - GET /api/boletins
 - POST /api/boletins  { bairroId? }

Observações:
 - Login admin simulado: usuário: admin / senha: admin
 - Banco: sqlite (prisma/dev.db)
 - Próximos passos: integrar WhatsApp, criar filas de curadoria, workflows de aprovação e páginas de validação.
