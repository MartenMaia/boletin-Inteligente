import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  await prisma.association.createMany({ data: [ { name: 'Associação Praia A' }, { name: 'Associação Praia B' } ] })
  const b1 = await prisma.bairro.create({ data: { name: 'Bairro Alfa', associationId: 1 } })
  const b2 = await prisma.bairro.create({ data: { name: 'Bairro Beta', associationId: 2 } })
  await prisma.cliente.createMany({ data: [ { name: 'Cliente 1', phone: '+5511999000001', bairroId: b1.id }, { name: 'Cliente 2', phone: '+5511999000002', bairroId: b2.id } ] })
  await prisma.aviso.createMany({ data: [ { source: 'manual', titulo: 'Obra na rua X', texto: 'Obra em andamento na Rua X.', bairroId: b1.id }, { source: 'manual', titulo: 'Evento', texto: 'Evento cultural na praça.', bairroId: b2.id } ] })

  // seed groups
  const g = await prisma.group.create({ data: { name: 'Moradores Bairro Alfa', description: 'Grupo de moradores do Bairro Alfa' } })
  await prisma.groupMember.create({ data: { groupId: g.id, name: 'João Silva', contact: '+5511999000111', bairroId: b1.id } })

  // seed bulletin settings example
  await prisma.bulletinSettings.create({ data: { title: 'Boletim diário padrão', types: JSON.stringify(['Segurança','Movimentação']), sources: JSON.stringify(['manual']), approver: 'Redator', frequency: 'Diário', segmentation: JSON.stringify(['Bairro']), groupId: g.id } })

  // seed sample boletins for UI testing
  const now = new Date()
  const bDate1 = new Date(now.getTime() - 5*24*60*60*1000) // 5 days ago
  const pDate1 = new Date(now.getTime() + 6*24*60*60*1000) // in 6 days
  const bDate2 = new Date(now.getTime() - 18*24*60*60*1000) // 18 days ago
  const pDate2 = new Date(now.getTime() + 9*24*60*60*1000) // in 9 days
  const bDate3 = null
  const pDate3 = new Date(now.getTime() + 14*24*60*60*1000) // in 14 days

  await prisma.boletim.createMany({ data: [
    { title: 'Boletim Centro', conteudo: 'Conteúdo do boletim Centro', ultimoEnvio: bDate1.toISOString(), proximoEnvio: pDate1.toISOString(), grupoAlvo: 'Centro', status: 'Aguardando revisão' },
    { title: 'Boletim Norte', conteudo: 'Conteúdo do boletim Norte', ultimoEnvio: bDate2.toISOString(), proximoEnvio: pDate2.toISOString(), grupoAlvo: 'Norte', status: 'Rascunho' },
    { title: 'Boletim Sul', conteudo: 'Conteúdo do boletim Sul', ultimoEnvio: null, proximoEnvio: pDate3.toISOString(), grupoAlvo: 'Sul', status: 'Aguardando aprovação' }
  ]})

  console.log('Seed completo')
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
