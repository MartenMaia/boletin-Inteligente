import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  const bairros = await prisma.bairro.findMany()
  const hoje = new Date()
  const start = new Date(hoje); start.setHours(0,0,0,0)
  const end = new Date(hoje); end.setHours(23,59,59,999)

  for(const b of bairros){
    const avisos = await prisma.aviso.findMany({ where: { bairroId: b.id, createdAt: { gte: start, lte: end } } })
    const conteudo = avisos.map(a=>`- [${a.titulo}] ${a.texto}`).join('\n') || 'Sem informes para hoje.'
    await prisma.boletim.create({ data: { bairroId: b.id, conteudo, status: 'published' } })
    console.log('Boletim gerado para', b.name)
  }
}

main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
