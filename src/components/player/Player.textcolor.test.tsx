import { afterEach, describe, test, expect } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { Player } from './Player'

/**
 * TDD RED: Tests for player text color visibility
 *
 * Requirement:
 * - When player background color is white or light, text should be black for visibility
 * - When player background color is dark, text should be white
 */
describe('Player - Text Color Visibility', () => {

	afterEach(() => {
		cleanup()
	})

	const defaultProps = {
		id: 'test-player',
		initialX: 10,
		initialY: 10,
		containerWidth: 800,
		containerHeight: 400,
		label: 'QB',
		onPositionChange: () => {},
		onLabelClick: () => {},
		onFill: () => {},
		interactable: true,
	}

	test('text color is black when player color is white', () => {
		const { container } = render(
			<Player {...defaultProps} color="#FFFFFF" />
		)

		// Find the label text element - it's the innermost div with the label text
		const textElement = container.querySelector('[style*="color"]') as HTMLElement
		expect(textElement).toBeDefined()

		// Check if style attribute contains color: black
		const styleAttr = textElement?.getAttribute('style') || ''
		expect(styleAttr).toMatch(/color:\s*(black|#000000|rgb\(0,\s*0,\s*0\))/i)
	})

	test('text color is white when player color is dark blue', () => {
		const { container } = render(
			<Player {...defaultProps} color="#3b82f6" />
		)

		const textElement = container.querySelector('[style*="color"]') as HTMLElement
		expect(textElement).toBeDefined()

		const styleAttr = textElement?.getAttribute('style') || ''
		expect(styleAttr).toMatch(/color:\s*(white|#ffffff|rgb\(255,\s*255,\s*255\))/i)
	})

	test('text color is black when player color is light yellow', () => {
		const { container } = render(
			<Player {...defaultProps} color="#FEF08A" />
		)

		const textElement = container.querySelector('[style*="color"]') as HTMLElement
		expect(textElement).toBeDefined()

		const styleAttr = textElement?.getAttribute('style') || ''
		expect(styleAttr).toMatch(/color:\s*(black|#000000|rgb\(0,\s*0,\s*0\))/i)
	})

	test('text color is white when player color is dark red', () => {
		const { container } = render(
			<Player {...defaultProps} color="#DC2626" />
		)

		const textElement = container.querySelector('[style*="color"]') as HTMLElement
		expect(textElement).toBeDefined()

		const styleAttr = textElement?.getAttribute('style') || ''
		expect(styleAttr).toMatch(/color:\s*(white|#ffffff|rgb\(255,\s*255,\s*255\))/i)
	})

	test('text color adapts when color changes dynamically', () => {
		const { container, rerender } = render(
			<Player {...defaultProps} color="#000000" />
		)

		// Initially black background, should have white text
		let textElement = container.querySelector('[style*="color"]') as HTMLElement
		let styleAttr = textElement?.getAttribute('style') || ''
		expect(styleAttr).toMatch(/color:\s*(white|#ffffff|rgb\(255,\s*255,\s*255\))/i)

		// Change to white background
		rerender(<Player {...defaultProps} color="#FFFFFF" />)

		// Should now have black text
		textElement = container.querySelector('[style*="color"]') as HTMLElement
		styleAttr = textElement?.getAttribute('style') || ''
		expect(styleAttr).toMatch(/color:\s*(black|#000000|rgb\(0,\s*0,\s*0\))/i)
	})
})
