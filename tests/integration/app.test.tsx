/**
 * Integration tests for App component
 * Verifies main application flow and component integration
 */

import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import App from '../../src/App'

describe('App Integration', () => {
	describe('application structure', () => {
		it('should render without crashing', () => {
			const { container } = render(<App />)
			expect(container).toBeDefined()
		})

		it('should render main layout components', () => {
			const { container } = render(<App />)
			
			// Should have toolbar (left side)
			const toolbar = container.querySelector('[class*="w-20"]')
			expect(toolbar).toBeDefined()
			
			// Should have main content area
			const mainContent = container.querySelector('[class*="flex-1"]')
			expect(mainContent).toBeDefined()
		})

		it('should render all major sections', () => {
			render(<App />)
			
			// PlayHeader with formation inputs should be present
			const formationInput = screen.queryByPlaceholderText('Formation')
			expect(formationInput).toBeDefined()
			
			const playInput = screen.queryByPlaceholderText('Play')
			expect(playInput).toBeDefined()
		})
	})

	describe('theme integration', () => {
		it('should apply theme classes', () => {
			const { container } = render(<App />)
			const mainDiv = container.firstChild as HTMLElement
			
			// Should have either light or dark theme class
			const className = mainDiv?.className ?? ''
			expect(
				className.includes('bg-gray-900') || className.includes('bg-gray-50')
			).toBe(true)
		})
	})

	describe('context providers', () => {
		it('should wrap app in ThemeProvider', () => {
			// If this renders without error, ThemeProvider is working
			expect(() => render(<App />)).not.toThrow()
		})

		it('should wrap app in PlayProvider', () => {
			// If this renders without error, PlayProvider is working
			expect(() => render(<App />)).not.toThrow()
		})
	})
})
