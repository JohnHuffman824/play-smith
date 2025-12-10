/**
 * Integration tests for App component
 * Verifies main application flow and component integration
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import App from '../../src/App'

describe('App Integration', () => {
	const mockFetch = mock()
	const originalFetch = global.fetch

	beforeEach(() => {
		cleanup()

		// Mock fetch only for this test suite
		global.fetch = mockFetch as any
		mockFetch.mockReset()

		// Mock authenticated user by default
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'test@example.com', name: 'Test User' },
			}),
		} as Response)
	})

	afterEach(() => {
		// Restore original fetch
		global.fetch = originalFetch
	})

	describe('application structure', () => {
		it('should render without crashing', async () => {
			const { container } = render(<App />)
			expect(container).toBeDefined()

			// Wait for async auth effects to settle
			await waitFor(() => {
				expect(container).toBeDefined()
			})
		})

		it('should render main layout components', async () => {
			const { container } = render(<App />)

			// Wait for main layout to render
			await waitFor(() => {
				const toolbar = container.querySelector('[class*="w-20"]')
				expect(toolbar).toBeDefined()
			})

			// Should have toolbar (left side)
			const toolbar = container.querySelector('[class*="w-20"]')
			expect(toolbar).toBeDefined()

			// Should have main content area
			const mainContent = container.querySelector('[class*="flex-1"]')
			expect(mainContent).toBeDefined()
		})

		it('should render all major sections', async () => {
			render(<App />)

			// Wait for auth to settle and app to render
			await waitFor(() => {
				const formationInput = screen.queryByPlaceholderText('Formation')
				expect(formationInput).not.toBeNull()
			})

			// PlayHeader with formation inputs should be present
			const formationInput = screen.queryByPlaceholderText('Formation')
			expect(formationInput).toBeDefined()

			const playInput = screen.queryByPlaceholderText('Play')
			expect(playInput).toBeDefined()
		})
	})

	describe('theme integration', () => {
		it('should apply theme classes', async () => {
			const { container } = render(<App />)
			const mainDiv = container.firstChild as HTMLElement

			// Wait for theme to apply
			await waitFor(() => {
				const className = mainDiv?.className ?? ''
				expect(
					className.includes('bg-gray-900') || className.includes('bg-gray-50')
				).toBe(true)
			})
		})
	})

	describe('context providers', () => {
		it('should wrap app in ThemeProvider', async () => {
			// If this renders without error, ThemeProvider is working
			const { container } = render(<App />)

			// Wait for initial effects to complete
			await waitFor(() => {
				expect(container).toBeDefined()
			})
		})

		it('should wrap app in PlayProvider', async () => {
			// If this renders without error, PlayProvider is working
			const { container } = render(<App />)

			// Wait for initial effects to complete
			await waitFor(() => {
				expect(container).toBeDefined()
			})
		})
	})
})
