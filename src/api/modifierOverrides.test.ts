import { describe, test, expect } from 'bun:test'
import { modifierOverridesAPI } from './modifierOverrides'

describe('modifier overrides API', () => {
  test('has required CRUD methods', () => {
    expect(typeof modifierOverridesAPI.listByModifier).toBe('function')
    expect(typeof modifierOverridesAPI.create).toBe('function')
    expect(typeof modifierOverridesAPI.update).toBe('function')
    expect(typeof modifierOverridesAPI.delete).toBe('function')
  })

  test('listByModifier is async', () => {
    expect(modifierOverridesAPI.listByModifier.constructor.name).toBe('AsyncFunction')
  })

  test('create is async', () => {
    expect(modifierOverridesAPI.create.constructor.name).toBe('AsyncFunction')
  })

  test('update is async', () => {
    expect(modifierOverridesAPI.update.constructor.name).toBe('AsyncFunction')
  })

  test('delete is async', () => {
    expect(modifierOverridesAPI.delete.constructor.name).toBe('AsyncFunction')
  })
})
