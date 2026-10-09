import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, resetRateLimit } from '../../src/lib/rateLimit'

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimit()
  })

  it('allows up to max requests within the window', () => {
    const key = 'test:127.0.0.1'
    expect(rateLimit(key, 3, 1000).allowed).toBe(true)
    expect(rateLimit(key, 3, 1001).allowed).toBe(true)
    expect(rateLimit(key, 3, 1002).allowed).toBe(true)
  })

  it('blocks the 4th request within the window', () => {
    const key = 'test:blocked'
    rateLimit(key, 3, 1000)
    rateLimit(key, 3, 1001)
    rateLimit(key, 3, 1002)
    const result = rateLimit(key, 3, 1003)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets after the window expires', () => {
    const key = 'test:reset'
    rateLimit(key, 2, 1000)
    rateLimit(key, 2, 1001)
    expect(rateLimit(key, 2, 1002).allowed).toBe(false)
    // After 1 hour window expires
    expect(rateLimit(key, 2, 1000 + 60 * 60 * 1000 + 1).allowed).toBe(true)
  })

  it('tracks different keys independently', () => {
    rateLimit('key-a', 1, 1000)
    expect(rateLimit('key-a', 1, 1001).allowed).toBe(false)
    expect(rateLimit('key-b', 1, 1001).allowed).toBe(true)
  })

  it('decrements remaining on each allowed request', () => {
    const key = 'test:remaining'
    expect(rateLimit(key, 3, 1000).remaining).toBe(2)
    expect(rateLimit(key, 3, 1001).remaining).toBe(1)
    expect(rateLimit(key, 3, 1002).remaining).toBe(0)
  })
})
