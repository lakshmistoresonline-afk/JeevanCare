import { describe, it, expect } from 'vitest'
import { POST } from '../../src/app/api/import/[type]/route'

describe('CSV Import Production Route Security Rules', () => {
  it('denies unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost/api/import/tenants', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ type: 'tenants' }) })
    expect(res.status).toBe(401)
  })

  it('rejects unknown or unsupported import types with 404', async () => {
    const req = new Request('http://localhost/api/import/unsupported', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ type: 'unsupported' }) })
    expect(res.status).toBe(404)
  })
})
