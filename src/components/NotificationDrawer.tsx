'use client'

import { useState } from 'react'
import { Card } from './primitives'
import { IconX, IconCheck } from './icons'

export type NotificationItem = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'appointment' | 'billing' | 'system'
}

export function NotificationDrawer() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', title: 'New Appointment Booked', message: 'Patient A booked an appointment for tomorrow at 10:00 AM.', time: '10m ago', read: false, type: 'appointment' },
    { id: '2', title: 'Payment Received', message: '₹500 payment recorded for Invoice #INV-0001.', time: '1h ago', read: false, type: 'billing' },
    { id: '3', title: 'System Updated', message: 'JeevanCare security compliance audit passed successfully.', time: '3h ago', read: true, type: 'system' },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((n) => n.map((item) => ({ ...item, read: true })))
  }

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle Notification Center"
        className="relative flex size-9 items-center justify-center rounded-xl border border-border bg-card text-ink shadow-2xs transition-colors hover:border-primary hover:text-primary"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Sliding Drawer */}
      {open && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl z-50 animate-fade-up overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-secondary/30">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-ink">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-ink p-1 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 transition-colors ${n.read ? 'bg-card' : 'bg-secondary/20'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-ink">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground tabular">{n.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
