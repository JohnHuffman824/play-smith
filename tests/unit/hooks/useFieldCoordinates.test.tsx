/**
 * Tests for useFieldCoordinates hook
 * Verifies hook provides coordinate system that updates with dimensions
 */

import { describe, it, expect, afterEach } from 'bun:test'
import { cleanup, renderHook } from '@testing-library/react'
import { useFieldCoordinates } from '../../../src/hooks/useFieldCoordinates'

describe('useFieldCoordinates', () => {

	afterEach(() => {
		cleanup()
	})

	it('should return coordinate system instance', () => {
		const { result } = renderHook(() =>
			useFieldCoordinates({ containerWidth: 800, containerHeight: 600 })
		)
		
		expect(result.current).toBeDefined()
		expect(result.current.scale).toBeGreaterThan(0)
	})

	it('should update when dimensions change', () => {
		const { result, rerender } = renderHook(
			({ width, height }) => useFieldCoordinates({ 
				containerWidth: width, 
				containerHeight: height 
			}),
			{ initialProps: { width: 800, height: 600 } }
		)
		
		const initialScale = result.current.scale
		
		rerender({ width: 1600, height: 1200 })
		
		expect(result.current.scale).toBe(initialScale * 2)
	})

	it('should provide consistent instance across renders', () => {
		const { result, rerender } = renderHook(() =>
			useFieldCoordinates({ containerWidth: 800, containerHeight: 600 })
		)
		
		const instance1 = result.current
		rerender()
		const instance2 = result.current
		
		expect(instance1).toBe(instance2) // Same instance
	})

	it('should convert coordinates correctly', () => {
		const { result } = renderHook(() =>
			useFieldCoordinates({ containerWidth: 800, containerHeight: 600 })
		)
		
		const pixels = result.current.feetToPixels(80, 30)
		expect(pixels.x).toBe(400) // 80 feet * 5 scale
		expect(pixels.y).toBe(450) // 600 - (30 * 5)
		
		const feet = result.current.pixelsToFeet(400, 450)
		expect(feet.x).toBe(80)
		expect(feet.y).toBe(30)
	})
})
