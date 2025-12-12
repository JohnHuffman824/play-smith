import { describe, test, expect } from 'bun:test'
import { applyModifier, getModifierRules } from './modifierApplication'

const mockFormation = {
  id: 1,
  name: 'Twins',
  positions: [
    { role: 'X', x: 15, y: 0 },
    { role: 'Y', x: 60, y: 2 },
    { role: 'Z', x: 85, y: 0 }
  ]
}

const mockModifier = {
  id: 1,
  name: 'Tight',
  default_rules: { role: 'Y', delta_x: -5, delta_y: 0 },
  overrides: [
    { formation_id: 2, override_rules: { role: 'X', delta_x: 3, delta_y: 0 } }
  ]
}

describe('getModifierRules', () => {
  test('returns default rules when no override exists', () => {
    const rules = getModifierRules(mockModifier, 1) // formation_id: 1 has no override

    expect(rules.role).toBe('Y')
    expect(rules.delta_x).toBe(-5)
  })

  test('returns override rules when override exists for formation', () => {
    const rules = getModifierRules(mockModifier, 2) // formation_id: 2 has override

    expect(rules.role).toBe('X')
    expect(rules.delta_x).toBe(3)
  })
})

describe('applyModifier', () => {
  test('applies modifier delta to correct player position', () => {
    const result = applyModifier(mockFormation, mockModifier)

    const yReceiver = result.positions.find(p => p.role === 'Y')
    expect(yReceiver?.x).toBe(55) // 60 + (-5)
    expect(yReceiver?.y).toBe(2) // unchanged
  })

  test('does not modify other player positions', () => {
    const result = applyModifier(mockFormation, mockModifier)

    const xReceiver = result.positions.find(p => p.role === 'X')
    expect(xReceiver?.x).toBe(15) // unchanged
  })
})
