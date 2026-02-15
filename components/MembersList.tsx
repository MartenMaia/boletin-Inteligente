import React, { useEffect, useState } from 'react'

export default function MembersList({ groupId }:{groupId:number}){
  const [members,setMembers]=useState<any[]>([])
  const [name,setName]=useState('')
  const [contact,setContact]=useState('')
  const [bairroId,setBairroId]=useState('')

  async function load(){
    const r=await fetch(`/api/groups/${groupId}/members`); const j=await r.json(); setMembers(j)
  }
  useEffect(()=>{ if(groupId) load() },[groupId])

  const submit=async (e:any)=>{
    e.preventDefault()
    await fetch(`/api/groups/${groupId}/members`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,contact,bairroId: bairroId? parseInt(bairroId): undefined})})
    setName(''); setContact(''); setBairroId('')
    load()
  }

  return (
    <div className="mt-4">
      <h4 className="font-semibold">Membros</h4>
      <form onSubmit={submit} className="mt-2 space-y-2">
        <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 border" />
        <input placeholder="Contato" value={contact} onChange={e=>setContact(e.target.value)} className="w-full p-2 border" />
        <input placeholder="Bairro ID (opcional)" value={bairroId} onChange={e=>setBairroId(e.target.value)} className="w-full p-2 border" />
        <button className="bg-teal text-white px-3 py-2 rounded">Adicionar Membro</button>
      </form>

      <ul className="mt-3 space-y-2">
        {members.map(m=> <li key={m.id} className="p-2 border rounded">{m.name} — {m.contact}</li>)}
      </ul>
    </div>
  )
}
