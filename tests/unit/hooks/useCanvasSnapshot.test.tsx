import { describe, test, expect } from 'bun:test'
import { captureCanvasSnapshot } from '../../../src/hooks/useCanvasSnapshot'

describe('captureCanvasSnapshot', () => {
	test('returns null for null container', () => {
		const result = captureCanvasSnapshot(null)
		expect(result).toBeNull()
	})

	test('returns data URL for valid SVG container', () => {
		const container = document.createElement('div')
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		svg.setAttribute('width', '100')
		svg.setAttribute('height', '100')
		container.appendChild(svg)

		const result = captureCanvasSnapshot(container)
		expect(result).not.toBeNull()
		expect(result?.dataUrl).toContain('data:image/svg+xml')
	})
})
