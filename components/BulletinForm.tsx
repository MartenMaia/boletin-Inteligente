import React, { useEffect, useState } from 'react'

export default function BulletinForm(){
  const [title,setTitle]=useState('')
  const [types,setTypes]=useState<string[]>([])
  const [sources,setSources]=useState<string[]>([])
  const [approver,setApprover]=useState('')
  const [frequency,setFrequency]=useState('Diário')
  const [segmentation,setSegmentation]=useState<string[]>([])
  const [groupId,setGroupId]=useState('')
  const [groups,setGroups]=useState<any[]>([])

  useEffect(()=>{ fetch('/api/groups').then(r=>r.json()).then(j=>setGroups(j)) },[])

  const toggle=(arr:string[], set:(a:string[])=>void, val:string)=>{
    set(arr.includes(val)? arr.filter(x=>x!==val): [...arr,val])
  }

  const submit=async (e:any)=>{
    e.preventDefault()
    await fetch('/api/boletins/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ title, types, sources, approver, frequency, segmentation, groupId: groupId? parseInt(groupId): undefined })})
    alert('Configurações salvas')
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Título do boletim" value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 border" />

      <div>
        <div className="font-semibold">Tipos de informação</div>
        <div className="flex gap-2 mt-2">
          {['Segurança','Movimentação','Balneabilidade','Alertas Climáticos'].map(t=> (
            <button type="button" key={t} onClick={()=>toggle(types,setTypes,t)} className={`px-3 py-1 rounded ${types.includes(t)? 'bg-primary text-white':'bg-white border'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-semibold">Fontes</div>
        <div className="flex gap-2 mt-2">
          {['E-mail','WhatsApp','API'].map(s=> (
            <button type="button" key={s} onClick={()=>toggle(sources,setSources,s)} className={`px-3 py-1 rounded ${sources.includes(s)? 'bg-primary text-white':'bg-white border'}`}>{s}</button>
          ))}
        </div>
      </div>

      <input placeholder="Aprovador (nome)" value={approver} onChange={e=>setApprover(e.target.value)} className="w-full p-2 border" />

      <div>
        <label className="block">Frequência</label>
        <select value={frequency} onChange={e=>setFrequency(e.target.value)} className="w-full p-2 border">
          <option>Diário</option>
          <option>Semanal</option>
          <option>Mensal</option>
          <option>Manual</option>
        </select>
      </div>

      <div>
        <div className="font-semibold">Segmentação</div>
        <div className="flex gap-2 mt-2">
          {['Bairro','Cidade','Região'].map(s=> (
            <button type="button" key={s} onClick={()=>toggle(segmentation,setSegmentation,s)} className={`px-3 py-1 rounded ${segmentation.includes(s)? 'bg-primary text-white':'bg-white border'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div>
        <label>Grupo alvo</label>
        <select value={groupId} onChange={e=>setGroupId(e.target.value)} className="w-full p-2 border">
          <option value=''>-- selecione --</option>
          {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <button className="bg-deep text-white px-3 py-2 rounded">Salvar Rascunho</button>
        <button className="bg-primary text-white px-3 py-2 rounded">Publicar</button>
      </div>
    </form>
  )
}
