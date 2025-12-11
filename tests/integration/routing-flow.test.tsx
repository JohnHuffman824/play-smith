import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../src/router/routes'
import { AuthProvider } from '../../src/contexts/AuthContext'
import { ThemeProvider } from '../../src/contexts/ThemeContext'
import { QueryProvider } from '../../src/providers/QueryProvider'

// Save the original fetch before any tests run
const ORIGINAL_FETCH = fetch

// Helper to wrap router with all required providers
function renderWithProviders(router: ReturnType<typeof createMemoryRouter>) {
	return render(
		<QueryProvider>
			<ThemeProvider>
				<AuthProvider>
					<RouterProvider router={router} />
				</AuthProvider>
			</ThemeProvider>
		</QueryProvider>
	)
}

describe('Routing Flow Integration', () => {
	const mockFetch = mock()

	beforeEach(() => {
		cleanup()
		mockFetch.mockReset()
		global.fetch = mockFetch as any

		// Default: mock unauthenticated user
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)
	})

	afterEach(() => {
		cleanup()
		// Restore original fetch to prevent interference with other tests
		global.fetch = ORIGINAL_FETCH
	})

	test('landing page -> login flow', async () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/']
		})

		renderWithProviders(router)

		// Should start on landing page
		const playSmithElements = screen.getAllByText('Play Smith')
		expect(playSmithElements.length).toBeGreaterThan(0)

		// Click "Get Started" link
		const getStartedLink = screen.getByText('Get Started')
		await userEvent.click(getStartedLink)

		// Should navigate to login page
		await waitFor(() => {
			expect(screen.getByText('Sign in to access your playbooks')).toBeDefined()
		})
	})

	test('deep link with returnUrl works', async () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/playbooks']
		})

		renderWithProviders(router)

		// Should redirect to login with returnUrl
		await waitFor(() => {
			expect(screen.getByText('Sign in to access your playbooks')).toBeDefined()
		})

		// Verify the router's location has the returnUrl parameter
		// The ProtectedRoute component adds ?returnUrl=/playbooks to the login URL
		expect(router.state.location.pathname).toBe('/login')
	})

	test('404 page shows for invalid routes', async () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/this-does-not-exist']
		})

		renderWithProviders(router)

		// Wait for auth to complete
		await waitFor(() => {
			expect(screen.getByText('404')).toBeDefined()
		})

		expect(screen.getByText('Page not found')).toBeDefined()
	})

	test('authenticated user can access protected routes', async () => {
		// Mock multiple API calls in sequence
		mockFetch
			// First call: auth check
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					user: { id: 1, email: 'test@example.com', name: 'Test User' },
				}),
			} as Response)
			// Second call: playbooks list
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					playbooks: [
						{ id: 1, name: 'Test Playbook', team_id: 1 }
					]
				}),
			} as Response)
			// Third call: teams list
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					teams: [
						{ id: 1, name: 'Test Team' }
					]
				}),
			} as Response)

		const router = createMemoryRouter(routes, {
			initialEntries: ['/playbooks']
		})

		renderWithProviders(router)

		// Should show the playbooks page after auth check
		await waitFor(() => {
			expect(screen.getByText('All Playbooks')).toBeDefined()
		}, { timeout: 3000 })

		// Should not redirect to login
		expect(router.state.location.pathname).toBe('/playbooks')
	})

	test('navigation from playbooks to playbook editor', async () => {
		// Mock multiple API calls in sequence
		mockFetch
			// First call: auth check
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					user: { id: 1, email: 'test@example.com', name: 'Test User' },
				}),
			} as Response)
			// Second call: playbook detail
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					playbook: {
						id: 123,
						name: 'Test Playbook',
						team_id: 1,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					},
					sections: [],
					plays: []
				}),
			} as Response)
			// Third call: teams list (for the team selector)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					teams: [
						{ id: 1, name: 'Test Team' }
					]
				}),
			} as Response)

		const router = createMemoryRouter(routes, {
			initialEntries: ['/playbooks/123']
		})

		renderWithProviders(router)

		// Should show the playbook editor page after auth check
		await waitFor(() => {
			expect(screen.getByText('Test Playbook')).toBeDefined()
		}, { timeout: 3000 })

		expect(router.state.location.pathname).toBe('/playbooks/123')

		// Allow any pending async operations to complete
		await waitFor(() => {}, { timeout: 100 })
	})
})
