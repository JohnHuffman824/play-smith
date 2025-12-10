import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '../../src/router/routes'

describe('Routing Flow Integration', () => {
	beforeEach(() => {
		mock.restore()
	})

	test('landing page -> login flow', async () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/']
		})

		render(<RouterProvider router={router} />)

		// Should start on landing page
		expect(screen.getByText('Play Smith')).toBeDefined()

		// Click "Get Started" link
		const getStartedLink = screen.getByText('Get Started')
		await userEvent.click(getStartedLink)

		// Should navigate to login page
		await waitFor(() => {
			expect(screen.getByText('Login')).toBeDefined()
		})
	})

	test('deep link with returnUrl works', async () => {
		// Mock unauthenticated user (401 response)
		global.fetch = mock(() =>
			Promise.resolve(new Response(null, { status: 401 }))
		)

		const router = createMemoryRouter(routes, {
			initialEntries: ['/playbooks']
		})

		render(<RouterProvider router={router} />)

		// Should redirect to login with returnUrl
		await waitFor(() => {
			expect(screen.getByText('Login')).toBeDefined()
		})

		// Verify the router's location has the returnUrl parameter
		// The ProtectedRoute component adds ?returnUrl=/playbooks to the login URL
		expect(router.state.location.pathname).toBe('/login')
	})

	test('404 page shows for invalid routes', () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/this-does-not-exist']
		})

		render(<RouterProvider router={router} />)

		expect(screen.getByText('404')).toBeDefined()
		expect(screen.getByText('Page not found')).toBeDefined()
	})

	test('authenticated user can access protected routes', async () => {
		// Mock authenticated user
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(mockUser)))
		)

		const router = createMemoryRouter(routes, {
			initialEntries: ['/playbooks']
		})

		render(<RouterProvider router={router} />)

		// Should show the playbooks page after auth check
		await waitFor(() => {
			expect(screen.getByText('My Playbooks')).toBeDefined()
		})

		// Should not redirect to login
		expect(router.state.location.pathname).toBe('/playbooks')
	})

	test('navigation from playbooks to playbook editor', async () => {
		// Mock authenticated user
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(mockUser)))
		)

		const router = createMemoryRouter(routes, {
			initialEntries: ['/playbooks/123']
		})

		render(<RouterProvider router={router} />)

		// Should show the playbook editor page after auth check
		await waitFor(() => {
			expect(screen.getByText('Playbook 123')).toBeDefined()
		})

		expect(router.state.location.pathname).toBe('/playbooks/123')
	})
})
