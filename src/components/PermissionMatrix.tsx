'use client'

import { useState } from 'react'
import { Card } from './primitives'
import { IconSettings } from './icons'

export function PermissionMatrix() {
  const [permissions, setPermissions] = useState([
    { role: 'Receptionist', patients: 'CRUD', appointments: 'CRUD', billing: 'Read/Write', emr: 'No Access' },
    { role: 'Doctor', patients: 'Read/Write', appointments: 'Read/Write', billing: 'Read-Only', emr: 'Full Access' },
    { role: 'Clinic Owner', patients: 'Full Access', appointments: 'Full Access', billing: 'Full Access', emr: 'Full Access' },
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
          <IconSettings size={16} />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold">Staff Role Permission Matrix</h2>
          <p className="text-xs text-muted-foreground">Configured access boundaries per clinic role.</p>
        </div>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left">
                <th className="p-3 font-bold text-ink">Role</th>
                <th className="p-3 font-bold text-ink">Patients Directory</th>
                <th className="p-3 font-bold text-ink">Appointments</th>
                <th className="p-3 font-bold text-ink">Billing & Invoices</th>
                <th className="p-3 font-bold text-ink">Clinical EMR & Rx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {permissions.map((p) => (
                <tr key={p.role} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-3 font-bold text-ink">{p.role}</td>
                  <td className="p-3"><span className="rounded bg-secondary px-2 py-0.5 font-semibold text-primary">{p.patients}</span></td>
                  <td className="p-3"><span className="rounded bg-secondary px-2 py-0.5 font-semibold text-primary">{p.appointments}</span></td>
                  <td className="p-3"><span className="rounded bg-secondary px-2 py-0.5 font-semibold text-ink">{p.billing}</span></td>
                  <td className="p-3"><span className="rounded bg-primary-soft px-2 py-0.5 font-bold text-primary">{p.emr}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
