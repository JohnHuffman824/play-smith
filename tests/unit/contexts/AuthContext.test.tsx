import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { act } from 'react'
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext'

// Mock fetch globally
const mockFetch = mock()
global.fetch = mockFetch as any

// Test component that uses useAuth
function TestComponent() {
	const { user, isLoading, isAuthenticated, login, register, logout } = useAuth()

	return (
		<div>
			<div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
			<div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
			<div data-testid="user">{user ? user.email : 'null'}</div>
			<button onClick={() => login({ email: 'test@example.com', password: 'pass' })}>
				Login
			</button>
			<button onClick={() => register({ email: 'new@example.com', name: 'New', password: 'pass' })}>
				Register
			</button>
			<button onClick={logout}>Logout</button>
		</div>
	)
}

describe('AuthContext', () => {
	beforeEach(() => {
		cleanup()
		mockFetch.mockReset()
	})

	test('provides auth state to children', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		// Initially loading
		expect(screen.getByTestId('loading').textContent).toBe('loading')

		// After load
		await waitFor(() => {
			expect(screen.getByTestId('loading').textContent).toBe('loaded')
		})

		expect(screen.getByTestId('authenticated').textContent).toBe('false')
		expect(screen.getByTestId('user').textContent).toBe('null')
	})

	test('checks session on mount', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'existing@example.com', name: 'Existing' },
			}),
		} as Response)

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('user').textContent).toBe('existing@example.com')
		})

		expect(screen.getByTestId('authenticated').textContent).toBe('true')
		expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.any(Object))
	})

	test('login updates user state', async () => {
		// Mock session check (no user)
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('loading').textContent).toBe('loaded')
		})

		// Mock login success
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'test@example.com', name: 'Test' },
			}),
		} as Response)

		const loginButton = screen.getByText('Login')
		await act(async () => {
			loginButton.click()
		})

		await waitFor(() => {
			expect(screen.getByTestId('user').textContent).toBe('test@example.com')
		})

		expect(screen.getByTestId('authenticated').textContent).toBe('true')
	})

	test('logout clears user state', async () => {
		// Mock session check (authenticated)
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'test@example.com', name: 'Test' },
			}),
		} as Response)

		render(
			<AuthProvider>
				<TestComponent />
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('user').textContent).toBe('test@example.com')
		})

		// Mock logout
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true }),
		} as Response)

		const logoutButton = screen.getByText('Logout')
		await act(async () => {
			logoutButton.click()
		})

		await waitFor(() => {
			expect(screen.getByTestId('user').textContent).toBe('null')
		})

		expect(screen.getByTestId('authenticated').textContent).toBe('false')
	})

	test('throws error when used outside provider', () => {
		function InvalidComponent() {
			useAuth() // This should throw
			return null
		}

		expect(() => {
			render(<InvalidComponent />)
		}).toThrow('useAuth must be used within AuthProvider')
	})
})
