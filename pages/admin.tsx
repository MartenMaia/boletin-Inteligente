import React, { useState } from 'react'

export default function Admin(){
  const [auth, setAuth] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')

  const login = (e:any)=>{
    e.preventDefault()
    if(user === 'admin' && pass === 'admin') setAuth(true)
    else alert('Credenciais inválidas')
  }

  if(!auth) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form className="bg-white p-6 rounded shadow w-full max-w-md" onSubmit={login}>
        <h2 className="text-xl font-semibold">Admin Login (simulado)</h2>
        <label className="block mt-4">Usuário<input value={user} onChange={e=>setUser(e.target.value)} className="w-full mt-1 p-2 border" /></label>
        <label className="block mt-2">Senha<input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full mt-1 p-2 border" /></label>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Entrar</button>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Admin</h1>
        <section className="mt-4 bg-white p-4 rounded shadow">
          <h2 className="font-semibold">Criar Aviso</h2>
          <AvisoForm />
        </section>
      </div>
    </div>
  )
}

function AvisoForm(){
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [bairroId, setBairroId] = useState('')

  const submit = async (e:any)=>{
    e.preventDefault()
    await fetch('/api/avisos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ source: 'manual', titulo, texto, bairroId: parseInt(bairroId) }) })
    alert('Aviso criado')
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <input placeholder="Título" value={titulo} onChange={e=>setTitulo(e.target.value)} className="w-full p-2 border" />
      <textarea placeholder="Texto" value={texto} onChange={e=>setTexto(e.target.value)} className="w-full p-2 border mt-2" />
      <input placeholder="Bairro ID" value={bairroId} onChange={e=>setBairroId(e.target.value)} className="w-full p-2 border mt-2" />
      <button className="mt-2 bg-green-600 text-white px-3 py-2 rounded">Criar</button>
    </form>
  )
}
