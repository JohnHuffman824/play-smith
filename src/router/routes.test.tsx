import { afterEach, describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from './routes'
import { AuthProvider } from '../contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { act } from 'react'

describe('routes', () => {

	afterEach(() => {
		cleanup()
	})

	const originalFetch = global.fetch

	beforeAll(() => {
		// Mock fetch for auth
		global.fetch = async (url: string) => {
			if (url.includes('/api/auth/me')) {
				return new Response(JSON.stringify({ user: null }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			if (url.includes('/api/teams')) {
				return new Response(JSON.stringify({ teams: [] }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			return new Response(null, { status: 404 })
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
					<SettingsProvider>
							<RouterProvider router={router} />
					</SettingsProvider>
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
					<SettingsProvider>
							<RouterProvider router={router} />
					</SettingsProvider>
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
					<SettingsProvider>
							<RouterProvider router={router} />
					</SettingsProvider>
				</AuthProvider>
			)
		})

		await waitFor(() => {
			expect(screen.getByText('404')).toBeDefined()
			expect(screen.getByText('Page not found')).toBeDefined()
		})
	})
})
