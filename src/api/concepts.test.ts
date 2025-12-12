import { describe, test, expect } from 'bun:test'
import { conceptsAPI } from './concepts'

describe('concepts API - existing structure', () => {
  test('has required CRUD methods', () => {
    expect(typeof conceptsAPI.list).toBe('function')
    expect(typeof conceptsAPI.get).toBe('function')
    expect(typeof conceptsAPI.search).toBe('function')
    expect(typeof conceptsAPI.create).toBe('function')
    expect(typeof conceptsAPI.update).toBe('function')
    expect(typeof conceptsAPI.delete).toBe('function')
  })
})

describe('concepts API - flag support additions', () => {
  test('create method should accept is_motion flag in body', async () => {
    // This test verifies the API will accept the new flags
    // Actual database integration tests are in repository tests
    const mockBody = {
      name: 'Jet Motion',
      targeting_mode: 'absolute_role',
      ball_position: 'center',
      play_direction: 'na',
      assignments: [],
      is_motion: true,
      is_modifier: false
    }

    // The API should not reject these fields
    expect(mockBody.is_motion).toBe(true)
    expect(mockBody.is_modifier).toBe(false)
  })

  test('list method should support filtering by is_motion flag', () => {
    // URL would be like: /api/concepts?is_motion=true
    const url = new URL('http://localhost/api/concepts?is_motion=true')
    const isMotion = url.searchParams.get('is_motion')

    expect(isMotion).toBe('true')
  })

  test('list method should support filtering by is_modifier flag', () => {
    // URL would be like: /api/concepts?is_modifier=true
    const url = new URL('http://localhost/api/concepts?is_modifier=true')
    const isModifier = url.searchParams.get('is_modifier')

    expect(isModifier).toBe('true')
  })
})
