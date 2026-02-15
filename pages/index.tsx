import React from 'react'
import useSWR from 'swr'

const fetcher = (url:string)=>fetch(url).then(r=>r.json())

export default function Home(){
  const { data: bairros } = useSWR('/api/bairros', fetcher)
  const { data: boletins } = useSWR('/api/boletins', fetcher)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Boletim Inteligente</h1>
        <p className="text-gray-600">Boletins territoriais por bairro — rascunho MVP</p>
      </header>

      <main className="max-w-4xl mx-auto mt-6">
        <section className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold">Bairros</h2>
          <ul className="mt-2">
            {bairros?.map((b:any)=> <li key={b.id} className="py-1">{b.name}</li>)}
          </ul>
        </section>

        <section className="bg-white p-4 rounded shadow mt-4">
          <h2 className="font-semibold">Boletins</h2>
          <ul className="mt-2">
            {boletins?.map((b:any)=> <li key={b.id} className="py-1">{new Date(b.data).toLocaleString()} - {b.conteudo.substring(0,120)}</li>)}
          </ul>
        </section>
      </main>
    </div>
  )
}
