import { describe, test, expect } from 'bun:test'
import { parseConceptQuery } from './smartParsing'
import { PRESET_ROUTES } from '../db/seeds/preset_routes'

const mockSavedConcepts = [
  { id: 1, name: 'X Slant', targeting_mode: 'absolute_role' },
  { id: 2, name: 'Mesh', targeting_mode: 'absolute_role' }
]

const mockRoles = ['X', 'Y', 'Z', 'H', 'RB', 'QB', 'TE']

describe('parseConceptQuery', () => {
  test('returns exact match when saved concept exists', () => {
    const result = parseConceptQuery('X Slant', mockSavedConcepts, mockRoles, PRESET_ROUTES)

    expect(result.type).toBe('exact_match')
    expect(result.concept?.name).toBe('X Slant')
  })

  test('returns composition when role + template match', () => {
    const result = parseConceptQuery('Y Post', mockSavedConcepts, mockRoles, PRESET_ROUTES)

    expect(result.type).toBe('composition')
    expect(result.composition?.role).toBe('Y')
    expect(result.composition?.template_name).toBe('Post')
    expect(result.composition?.is_saved).toBe(false)
  })

  test('returns no_match when neither saved nor composable', () => {
    const result = parseConceptQuery('Banana Split', mockSavedConcepts, mockRoles, PRESET_ROUTES)

    expect(result.type).toBe('no_match')
    expect(result.suggestion).toBe('create_new')
  })

  test('handles case-insensitive matching', () => {
    const result = parseConceptQuery('x slant', mockSavedConcepts, mockRoles, PRESET_ROUTES)

    expect(result.type).toBe('exact_match')
  })

  test('returns prompt when standalone route typed without role', () => {
    const result = parseConceptQuery('Slant', mockSavedConcepts, mockRoles, PRESET_ROUTES)

    expect(result.type).toBe('needs_role')
    expect(result.template_name).toBe('Slant')
  })
})
