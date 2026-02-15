import React, { useEffect, useState } from 'react'

export default function GroupList(){
  const [groups,setGroups]=useState<any[]>([])
  async function load(){
    const r=await fetch('/api/groups'); const j=await r.json(); setGroups(j)
  }
  useEffect(()=>{ load() },[])
  return (
    <div>
      <h3 className="font-semibold">Grupos</h3>
      <ul className="mt-2 space-y-2">
        {groups.map(g=> (
          <li key={g.id} className="p-2 border rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-sm text-gray-600">{g.description}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
