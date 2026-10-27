'use client'

import { useState } from 'react'
import { Card } from './primitives'
import { IconBuilding } from './icons'

export function RoomAllocationMatrix({ doctors = [] }: { doctors: { id: string; name: string }[] }) {
  const [rooms, setRooms] = useState([
    { id: 'room-1', name: 'Consultation Room 1', doctorId: doctors[0]?.id || '', token: 'T-01' },
    { id: 'room-2', name: 'Consultation Room 2', doctorId: doctors[1]?.id || '', token: 'T-03' },
    { id: 'room-3', name: 'Pediatric Examination Room', doctorId: '', token: '—' },
  ])

  const assignDoctor = (roomId: string, doctorId: string) => {
    setRooms((r) => r.map((room) => (room.id === roomId ? { ...room, doctorId } : room)))
  }

  return (
    <Card className="p-6 space-y-4 border-border/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
            <IconBuilding size={16} />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">Clinical Room Allocation Matrix</h3>
            <p className="text-xs text-muted-foreground">Assign attending physicians to physical clinic rooms for live OPD queue flow</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const assignedDoc = doctors.find((d) => d.id === room.doctorId)
          return (
            <div key={room.id} className="rounded-2xl border border-border bg-canvas p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-ink">{room.name}</h4>
                  <span className="inline-block mt-1 rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
                    Active Token: {room.token}
                  </span>
                </div>
                <span className={`size-2.5 rounded-full ${room.doctorId ? 'bg-primary animate-pulse' : 'bg-faint'}`} />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Attending Doctor</label>
                <select
                  value={room.doctorId}
                  onChange={(e) => assignDoctor(room.id, e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-ink focus:border-primary focus:outline-hidden"
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-border/60 text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>Status:</span>
                <span className={assignedDoc ? 'text-primary font-bold' : 'text-faint'}>
                  {assignedDoc ? `Occupied by ${assignedDoc.name}` : 'Available'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
