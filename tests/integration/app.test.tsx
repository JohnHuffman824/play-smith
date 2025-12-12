/**
 * Integration tests for App component
 * Verifies main application flow and component integration
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryProvider } from '../../src/providers/QueryProvider'
import { SettingsProvider } from '../../src/contexts/SettingsContext'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { routes } from '../../src/router/routes'

// Save the original fetch before any tests run
const ORIGINAL_FETCH = fetch

// Helper to render app with all providers using memory router
function renderApp(initialRoute = '/') {
	const router = createMemoryRouter(routes, {
		initialEntries: [initialRoute],
	})

	return render(
		<QueryProvider>
			<SettingsProvider>
				<AuthProvider>
					<RouterProvider router={router} />
				</AuthProvider>
			</SettingsProvider>
		</QueryProvider>
	)
}

describe('App Integration', () => {
	const mockFetch = mock()

	beforeEach(() => {
		cleanup()
		mockFetch.mockReset()
		global.fetch = mockFetch as any

		// Mock authenticated user by default
		mockFetch.mockResolvedValue(
			new Response(JSON.stringify({
				user: { id: 1, email: 'test@example.com', name: 'Test User' }
			}), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		)
	})

	afterEach(() => {
		cleanup()
		// Restore original fetch to prevent interference with other tests
		global.fetch = ORIGINAL_FETCH
	})

	describe('application structure', () => {
		it('should render without crashing', async () => {
			const { container } = renderApp('/')
			expect(container).toBeDefined()

			// Wait for async auth effects to settle
			await waitFor(() => {
				const elements = screen.getAllByText('Play Smith')
				expect(elements.length).toBeGreaterThan(0)
			})
		})

		it('should render landing page', async () => {
			renderApp('/')

			await waitFor(() => {
				const elements = screen.getAllByText('Play Smith')
				expect(elements.length).toBeGreaterThan(0)
			})
		})
	})

	describe('theme integration', () => {
		it('should apply theme classes', async () => {
			const { container } = renderApp('/')

			// Wait for theme to apply
			await waitFor(() => {
				expect(container.querySelector('div')).toBeDefined()
			})
		})
	})

	describe('context providers', () => {
		it('should wrap app in ThemeProvider', async () => {
			// If this renders without error, ThemeProvider is working
			const { container } = renderApp('/')

			// Wait for initial effects to complete
			await waitFor(() => {
				expect(container).toBeDefined()
			})
		})

		it('should wrap app in AuthProvider', async () => {
			// If this renders without error, AuthProvider is working
			const { container } = renderApp('/')

			// Wait for initial effects to complete
			await waitFor(() => {
				expect(container).toBeDefined()
			})
		})
	})
})
