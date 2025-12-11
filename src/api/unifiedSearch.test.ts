import { describe, test, expect } from 'bun:test'
import { unifiedSearchAPI } from './unifiedSearch'

describe('unified search API', () => {
  test('has search method', () => {
    expect(typeof unifiedSearchAPI.search).toBe('function')
    expect(unifiedSearchAPI.search.constructor.name).toBe('AsyncFunction')
  })

  test('search method exists and is async', () => {
    expect(unifiedSearchAPI.search).toBeDefined()
  })

  test('API exports search interface', () => {
    const methods = Object.keys(unifiedSearchAPI)
    expect(methods).toContain('search')
  })
})
