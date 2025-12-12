import { describe, test, expect } from 'bun:test'
import type { BaseConcept, ModifierOverride, ComposedConcept } from './concept.types'

describe('concept types', () => {
  test('BaseConcept includes is_motion and is_modifier flags', () => {
    const concept: BaseConcept = {
      id: 1,
      team_id: 1,
      playbook_id: null,
      name: 'Test',
      description: null,
      thumbnail: null,
      targeting_mode: 'absolute_role',
      ball_position: 'center',
      play_direction: 'na',
      is_motion: false,
      is_modifier: false,
      created_by: 1,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0,
      last_used_at: null
    }
    expect(concept.is_motion).toBe(false)
    expect(concept.is_modifier).toBe(false)
  })

  test('ModifierOverride has required fields', () => {
    const override: ModifierOverride = {
      id: 1,
      modifier_concept_id: 1,
      formation_id: 1,
      override_rules: { role: 'Y', delta_x: -3, delta_y: 0 },
      created_at: new Date()
    }
    expect(override.override_rules.role).toBe('Y')
  })

  test('ComposedConcept represents auto-composed role+template', () => {
    const composed: ComposedConcept = {
      role: 'X',
      template_name: 'Slant',
      drawing_data: { paths: [] },
      is_saved: false
    }
    expect(composed.is_saved).toBe(false)
  })
})
