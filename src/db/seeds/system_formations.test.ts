import { describe, test, expect } from 'bun:test'
import { SYSTEM_FORMATIONS } from './system_formations'

describe('system formations seed data', () => {
  test('contains required default formations', () => {
    const names = SYSTEM_FORMATIONS.map(f => f.name)
    expect(names).toContain('I-Form')
    expect(names).toContain('Shotgun')
    expect(names).toContain('Spread')
    expect(names).toContain('Twins')
    expect(names).toContain('Trips')
    expect(names).toContain('Empty')
  })

  test('each formation has valid player positions', () => {
    for (const formation of SYSTEM_FORMATIONS) {
      expect(formation.positions.length).toBeGreaterThan(0)
      expect(formation.positions.length).toBeLessThanOrEqual(11)

      for (const pos of formation.positions) {
        expect(pos.role).toBeDefined()
        expect(typeof pos.x).toBe('number')
        expect(typeof pos.y).toBe('number')
      }
    }
  })

  test('each formation has exactly one QB and one C', () => {
    for (const formation of SYSTEM_FORMATIONS) {
      const qbs = formation.positions.filter(p => p.role === 'QB')
      const centers = formation.positions.filter(p => p.role === 'C')
      expect(qbs.length).toBe(1)
      expect(centers.length).toBe(1)
    }
  })
})
