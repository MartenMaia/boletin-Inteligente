import React, { useState } from 'react'
import GroupForm from '../components/GroupForm'
import GroupList from '../components/GroupList'
import MembersList from '../components/MembersList'
import BulletinForm from '../components/BulletinForm'

export default function Admin(){
  const [auth, setAuth] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [activeGroup, setActiveGroup] = useState<number | null>(null)
  const [tab, setTab] = useState('boletins')

  const login = (e:any)=>{
    e.preventDefault()
    if(user === 'admin' && pass === 'admin') setAuth(true)
    else alert('Credenciais inválidas')
  }

  if(!auth) return (
    <div className="min-h-screen flex items-center justify-center bg-sky">
      <form className="bg-white p-6 rounded shadow w-full max-w-md" onSubmit={login}>
        <h2 className="text-xl font-semibold">Admin Login (simulado)</h2>
        <label className="block mt-4">Usuário<input value={user} onChange={e=>setUser(e.target.value)} className="w-full mt-1 p-2 border" /></label>
        <label className="block mt-2">Senha<input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full mt-1 p-2 border" /></label>
        <button className="mt-4 bg-deep text-white px-4 py-2 rounded">Entrar</button>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-sky p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Admin</h1>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <nav className="col-span-1 bg-white p-4 rounded shadow">
            <ul className="space-y-2">
              <li><button onClick={()=>setTab('boletins')} className="w-full text-left">Boletins</button></li>
              <li><button onClick={()=>setTab('groups')} className="w-full text-left">Grupos</button></li>
              <li><button onClick={()=>setTab('new')} className="w-full text-left">Novo Boletim</button></li>
            </ul>
          </nav>

          <main className="col-span-2">
            {tab === 'boletins' && (
              <section className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold">Boletins</h2>
                <p className="text-sm text-gray-600">Acompanhe os boletins existentes. Se não houver boletins, cadastre um novo.</p>
                {/* TODO: list boletins */}
              </section>
            )}

            {tab === 'groups' && (
              <section className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold">Grupos</h2>
                <GroupForm onCreated={()=>{ /* refresh hack: reload page */ window.location.reload() }} />
                <div className="mt-4">
                  <GroupList />
                </div>
              </section>
            )}

            {tab === 'new' && (
              <section className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold">Novo Boletim</h2>
                <BulletinForm />
              </section>
            )}
          </main>
        </div>

      </div>
    </div>
  )
}
