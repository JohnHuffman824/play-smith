import { describe, test, expect } from 'bun:test'
import { isInLOSSnapZone, applyLOSSnap } from './los-snap.utils'

describe('LOS Snap Utils', () => {
	describe('isInLOSSnapZone', () => {
		test('returns true for y=28 (offensive boundary)', () => {
			expect(isInLOSSnapZone(28)).toBe(true)
		})

		test('returns true for y=30 (on LOS)', () => {
			expect(isInLOSSnapZone(30)).toBe(true)
		})

		test('returns true for y=32 (defensive boundary)', () => {
			expect(isInLOSSnapZone(32)).toBe(true)
		})

		test('returns true for y=29 (between offensive boundary and LOS)', () => {
			expect(isInLOSSnapZone(29)).toBe(true)
		})

		test('returns false for y=27.9 (just below snap zone)', () => {
			expect(isInLOSSnapZone(27.9)).toBe(false)
		})

		test('returns false for y=32.1 (just above snap zone)', () => {
			expect(isInLOSSnapZone(32.1)).toBe(false)
		})

		test('returns false for y=20 (far below snap zone)', () => {
			expect(isInLOSSnapZone(20)).toBe(false)
		})

		test('returns false for y=40 (far above snap zone)', () => {
			expect(isInLOSSnapZone(40)).toBe(false)
		})
	})

	describe('applyLOSSnap', () => {
		test('snaps offensive side (y=29) to y=28', () => {
			const result = applyLOSSnap(50, 29)
			expect(result.x).toBe(50)
			expect(result.y).toBe(28)
			expect(result.snapped).toBe(true)
		})

		test('snaps y=30 (exactly on LOS) to offensive side y=28', () => {
			const result = applyLOSSnap(80, 30)
			expect(result.x).toBe(80)
			expect(result.y).toBe(28)
			expect(result.snapped).toBe(true)
		})

		test('snaps defensive side (y=31) to y=32', () => {
			const result = applyLOSSnap(70, 31)
			expect(result.x).toBe(70)
			expect(result.y).toBe(32)
			expect(result.snapped).toBe(true)
		})

		test('snaps defensive side (y=31.5) to y=32', () => {
			const result = applyLOSSnap(60, 31.5)
			expect(result.x).toBe(60)
			expect(result.y).toBe(32)
			expect(result.snapped).toBe(true)
		})

		test('snaps offensive side (y=28.5) to y=28', () => {
			const result = applyLOSSnap(90, 28.5)
			expect(result.x).toBe(90)
			expect(result.y).toBe(28)
			expect(result.snapped).toBe(true)
		})

		test('does not snap y=27 (outside zone)', () => {
			const result = applyLOSSnap(50, 27)
			expect(result.x).toBe(50)
			expect(result.y).toBe(27)
			expect(result.snapped).toBe(false)
		})

		test('does not snap y=33 (outside zone)', () => {
			const result = applyLOSSnap(50, 33)
			expect(result.x).toBe(50)
			expect(result.y).toBe(33)
			expect(result.snapped).toBe(false)
		})

		test('does not snap y=40 (far outside zone)', () => {
			const result = applyLOSSnap(80, 40)
			expect(result.x).toBe(80)
			expect(result.y).toBe(40)
			expect(result.snapped).toBe(false)
		})

		test('preserves X coordinate', () => {
			const result = applyLOSSnap(123.45, 29)
			expect(result.x).toBe(123.45)
			expect(result.y).toBe(28)
		})
	})
})
