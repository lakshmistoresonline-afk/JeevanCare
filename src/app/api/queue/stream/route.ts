import { getPayloadClient, requireDashboardSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireDashboardSession().catch(() => null)
  if (!session?.tenant) {
    return new Response('Unauthorized', { status: 401 })
  }

  const tenantId = session.tenant.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false

      const sendEvent = async () => {
        if (isClosed) return
        try {
          const payload = await getPayloadClient()
          const todayStart = new Date()
          todayStart.setHours(0, 0, 0, 0)
          const todayEnd = new Date(todayStart.getTime() + 24 * 3600 * 1000)

          const res = await payload.find({
            collection: 'appointments',
            where: {
              tenant: { equals: tenantId },
              status: { in: ['checked-in', 'in-consultation'] },
              start: { greater_than_equal: todayStart.toISOString(), less_than: todayEnd.toISOString() },
            },
            limit: 20,
            depth: 0,
            select: { tokenNumber: true, status: true, priority: true },
            overrideAccess: true,
          })

          const data = JSON.stringify({
            updatedAt: new Date().toISOString(),
            count: res.totalDocs,
            docs: res.docs,
          })

          controller.enqueue(encoder.encode(`event: queue-update\ndata: ${data}\n\n`))
        } catch {}
      }

      // Initial broadcast
      await sendEvent()

      // Broadcast update stream every 3 seconds
      const interval = setInterval(sendEvent, 3000)

      return () => {
        isClosed = true
        clearInterval(interval)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
