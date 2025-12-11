import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from './routes'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { act } from 'react'

describe('routes', () => {
	const originalFetch = global.fetch

	beforeAll(() => {
		// Mock fetch for auth
		global.fetch = async (url: string) => {
			if (url.includes('/api/auth/me')) {
				return {
					ok: true,
					json: async () => ({ user: null })
				} as Response
			}
			if (url.includes('/api/teams')) {
				return {
					ok: true,
					json: async () => ({ teams: [] })
				} as Response
			}
			return { ok: false, status: 404 } as Response
		}
	})

	afterAll(() => {
		// Restore original fetch
		global.fetch = originalFetch
	})
	test('landing page route works', async () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/']
		})

		await act(async () => {
			render(
				<AuthProvider>
					<ThemeProvider>
							<RouterProvider router={router} />
					</ThemeProvider>
				</AuthProvider>
			)
		})

		await waitFor(() => {
			expect(screen.getByText('Play Smith')).toBeDefined()
		})
	})

	test('login page route works', async () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/login']
		})

		await act(async () => {
			render(
				<AuthProvider>
					<ThemeProvider>
							<RouterProvider router={router} />
					</ThemeProvider>
				</AuthProvider>
			)
		})

		await waitFor(() => {
			expect(screen.getByText('Sign in to access your playbooks')).toBeDefined()
		})
	})

	test('404 page route works', async () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/nonexistent']
		})

		await act(async () => {
			render(
				<AuthProvider>
					<ThemeProvider>
							<RouterProvider router={router} />
					</ThemeProvider>
				</AuthProvider>
			)
		})

		await waitFor(() => {
			expect(screen.getByText('404')).toBeDefined()
			expect(screen.getByText('Page not found')).toBeDefined()
		})
	})
})
