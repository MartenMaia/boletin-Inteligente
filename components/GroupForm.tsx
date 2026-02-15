import React, { useState } from 'react'

export default function GroupForm({ onCreated }:{onCreated?:()=>void}){
  const [name,setName]=useState('')
  const [desc,setDesc]=useState('')
  const submit = async (e:any)=>{
    e.preventDefault()
    await fetch('/api/groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,description:desc})})
    setName(''); setDesc('')
    onCreated && onCreated()
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <input placeholder="Nome do grupo" value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 border" />
      <input placeholder="Descrição" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-2 border" />
      <button className="bg-primary text-white px-3 py-2 rounded">Criar Grupo</button>
    </form>
  )
}
