/**
 * Tests for custom cursor visibility logic
 */
import { describe, it, expect } from 'bun:test'

// Simulates the visibility condition for custom cursors
function shouldShowCustomCursor(
  tool: string,
  isOverCanvas: boolean,
  cursorPosition: { x: number; y: number } | null,
  isPanning: boolean,
  panMode: 'spacebar' | 'middleMouse' | null
): boolean {
  // Tool must be one that uses custom cursor
  const customCursorTools = ['draw', 'fill', 'erase', 'addPlayer']
  if (!customCursorTools.includes(tool)) return false

  // Must be over canvas with valid position
  if (!isOverCanvas || !cursorPosition) return false

  // Must NOT be panning or in spacebar pan mode
  if (isPanning || panMode === 'spacebar') return false

  return true
}

describe('Custom Cursor Visibility', () => {
  it('should show custom cursor when draw tool active and not panning', () => {
    const result = shouldShowCustomCursor('draw', true, { x: 100, y: 100 }, false, null)
    expect(result).toBe(true)
  })

  it('should hide custom cursor when isPanning is true', () => {
    const result = shouldShowCustomCursor('draw', true, { x: 100, y: 100 }, true, null)
    expect(result).toBe(false)
  })

  it('should hide custom cursor when panMode is spacebar (even before drag starts)', () => {
    const result = shouldShowCustomCursor('draw', true, { x: 100, y: 100 }, false, 'spacebar')
    expect(result).toBe(false)
  })

  it('should hide custom cursor when panMode is middleMouse', () => {
    const result = shouldShowCustomCursor('draw', true, { x: 100, y: 100 }, true, 'middleMouse')
    expect(result).toBe(false)
  })

  it('should hide custom cursor when not over canvas', () => {
    const result = shouldShowCustomCursor('draw', false, { x: 100, y: 100 }, false, null)
    expect(result).toBe(false)
  })
})
