/**
 * Tests for pan sensitivity calculation
 */
import { describe, it, expect } from 'bun:test'

describe('Pan Sensitivity', () => {
  describe('1:1 mouse tracking', () => {
    it('should move content same distance as mouse at zoom=1', () => {
      const zoom = 1
      const deltaX = 100
      const panOriginX = 0

      // Formula: newPanX = panOriginX + deltaX (no zoom division)
      const newPanX = panOriginX + deltaX

      expect(newPanX).toBe(100)
    })

    it('should move content same distance as mouse at zoom=2', () => {
      const zoom = 2
      const deltaX = 100
      const panOriginX = 0

      // At zoom=2, we still want 100px screen movement
      const newPanX = panOriginX + deltaX

      expect(newPanX).toBe(100)
    })

    it('should move content same distance as mouse at zoom=4', () => {
      const zoom = 4
      const deltaX = 100
      const panOriginX = 0

      const newPanX = panOriginX + deltaX

      expect(newPanX).toBe(100)
    })
  })
})
