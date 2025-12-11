import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthProvider } from '../contexts/AuthContext'

describe('ProtectedRoute', () => {

	afterEach(() => {
		cleanup()
	})

	const originalFetch = global.fetch

	beforeEach(() => {
		mock.restore()
	})

	afterEach(() => {
		// Restore original fetch to prevent pollution
		global.fetch = originalFetch
	})

	test('shows loading state while checking auth', () => {
		// Mock a slow auth check that never resolves
		global.fetch = mock((url: string) => {
			if (url.includes('/api/auth/me')) {
				return new Promise(() => {}) // Never resolves
			}
			return Promise.resolve(new Response(null, { status: 404 }))
		})

		render(
			<AuthProvider>
				<MemoryRouter>
					<ProtectedRoute>
						<div>Protected Content</div>
					</ProtectedRoute>
				</MemoryRouter>
			</AuthProvider>
		)

		expect(screen.getByText('Loading...')).toBeDefined()
	})

	test('renders children when user is authenticated', async () => {
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test' }
		global.fetch = mock((url: string) => {
			if (url.includes('/api/auth/me')) {
				return Promise.resolve(
					new Response(JSON.stringify({ user: mockUser }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					})
				)
			}
			return Promise.resolve(new Response(null, { status: 404 }))
		})

		render(
			<AuthProvider>
				<MemoryRouter>
					<ProtectedRoute>
						<div>Protected Content</div>
					</ProtectedRoute>
				</MemoryRouter>
			</AuthProvider>
		)

		// Wait for auth check to complete
		await waitFor(() => {
			expect(screen.getByText('Protected Content')).toBeDefined()
		})
	})

	test('redirects to login when user is not authenticated', async () => {
		global.fetch = mock((url: string) => {
			if (url.includes('/api/auth/me')) {
				return Promise.resolve(
					new Response(JSON.stringify({ user: null }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					})
				)
			}
			return Promise.resolve(new Response(null, { status: 404 }))
		})

		const { container } = render(
			<AuthProvider>
				<MemoryRouter initialEntries={['/playbooks']}>
					<ProtectedRoute>
						<div>Protected Content</div>
					</ProtectedRoute>
				</MemoryRouter>
			</AuthProvider>
		)

		// Wait for auth check to complete
		await waitFor(() => {
			// After auth check, user is null, so ProtectedRoute should not render children
			// Instead it renders a Navigate component which doesn't show the protected content
			const content = container.querySelector('div')?.textContent
			expect(content).not.toContain('Protected Content')
		})
	})
})
