import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

describe('ProtectedRoute', () => {
	beforeEach(() => {
		mock.restore()
	})

	test('shows loading state while checking auth', () => {
		// Mock a slow auth check
		global.fetch = mock(() => new Promise(() => {})) // Never resolves

		render(
			<MemoryRouter>
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>
			</MemoryRouter>
		)

		expect(screen.getByText('Loading...')).toBeDefined()
	})

	test('renders children when user is authenticated', async () => {
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test' }
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(mockUser)))
		)

		render(
			<MemoryRouter>
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>
			</MemoryRouter>
		)

		// Wait for auth check to complete
		await waitFor(() => {
			expect(screen.getByText('Protected Content')).toBeDefined()
		})
	})

	test('redirects to login when user is not authenticated', async () => {
		global.fetch = mock(() =>
			Promise.resolve(new Response(null, { status: 401 }))
		)

		render(
			<MemoryRouter initialEntries={['/playbooks']}>
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>
			</MemoryRouter>
		)

		// Wait for auth check to complete and redirect to happen
		await waitFor(() => {
			// Component should redirect, so protected content should not be visible
			expect(() => screen.getByText('Protected Content')).toThrow()
		})
	})
})
