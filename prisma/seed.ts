import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  await prisma.association.createMany({ data: [ { name: 'Associação Praia A' }, { name: 'Associação Praia B' } ] })
  const b1 = await prisma.bairro.create({ data: { name: 'Bairro Alfa', associationId: 1 } })
  const b2 = await prisma.bairro.create({ data: { name: 'Bairro Beta', associationId: 2 } })
  await prisma.cliente.createMany({ data: [ { name: 'Cliente 1', phone: '+5511999000001', bairroId: b1.id }, { name: 'Cliente 2', phone: '+5511999000002', bairroId: b2.id } ] })
  await prisma.aviso.createMany({ data: [ { source: 'manual', titulo: 'Obra na rua X', texto: 'Obra em andamento na Rua X.', bairroId: b1.id }, { source: 'manual', titulo: 'Evento', texto: 'Evento cultural na praça.', bairroId: b2.id } ] })
  console.log('Seed completo')
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
