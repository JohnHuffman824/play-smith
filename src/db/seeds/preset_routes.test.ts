import { describe, test, expect } from 'bun:test'
import { PRESET_ROUTES } from './preset_routes'

describe('preset routes seed data', () => {
  test('contains standard route tree (1-9)', () => {
    const names = PRESET_ROUTES.map(r => r.name.toLowerCase())
    expect(names).toContain('flat')
    expect(names).toContain('slant')
    expect(names).toContain('comeback')
    expect(names).toContain('curl')
    expect(names).toContain('out')
    expect(names).toContain('in')
    expect(names).toContain('corner')
    expect(names).toContain('post')
    expect(names).toContain('go')
  })

  test('each route has valid drawing data', () => {
    for (const route of PRESET_ROUTES) {
      expect(route.name).toBeDefined()
      expect(route.drawing_data).toBeDefined()
      expect(route.drawing_data.paths).toBeDefined()
      expect(Array.isArray(route.drawing_data.paths)).toBe(true)
    }
  })

  test('routes are role-agnostic (no specific role assignment)', () => {
    for (const route of PRESET_ROUTES) {
      // Routes should not have a hardcoded role - they're templates
      expect(route.role).toBeUndefined()
    }
  })
})
