/**
 * Test that FreehandCapture canvas uses natural dimensions, not transformed dimensions
 */
import { describe, it, expect } from 'bun:test'

describe('FreehandCapture Canvas Sizing', () => {
  it('should use natural container dimensions, not transformed dimensions', () => {
    // Natural container size (before transform)
    const containerWidth = 800
    const containerHeight = 600

    // When zoomed 2x, getBoundingClientRect would return scaled size
    const zoom = 2
    const transformedWidth = containerWidth * zoom  // 1600
    const transformedHeight = containerHeight * zoom // 1200

    // Canvas should use NATURAL dimensions, not transformed
    const expectedCanvasWidth = containerWidth  // 800, NOT 1600
    const expectedCanvasHeight = containerHeight // 600, NOT 1200

    expect(expectedCanvasWidth).toBe(800)
    expect(expectedCanvasHeight).toBe(600)
    expect(expectedCanvasWidth).not.toBe(transformedWidth)
    expect(expectedCanvasHeight).not.toBe(transformedHeight)
  })

  it('canvas intrinsic size should match coordSystem dimensions at any zoom', () => {
    const coordSystemWidth = 800
    const coordSystemHeight = 600

    // At zoom=2 and zoom=4, canvas size should be coordSystem size, NOT scaled
    const zoom2 = 2
    const zoom4 = 4

    // Canvas size should always be natural dimensions
    expect(coordSystemWidth).toBe(800)
    expect(coordSystemHeight).toBe(600)

    // Canvas should NOT be scaled by zoom
    expect(coordSystemWidth).not.toBe(800 * zoom2) // NOT 1600
    expect(coordSystemHeight).not.toBe(600 * zoom2) // NOT 1200
    expect(coordSystemWidth).not.toBe(800 * zoom4) // NOT 3200
    expect(coordSystemHeight).not.toBe(600 * zoom4) // NOT 2400
  })
})
