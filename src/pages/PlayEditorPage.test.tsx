import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'
import { PlayEditorPage } from './PlayEditorPage'
import { act } from 'react'

describe('PlayEditorPage', () => {
	const originalFetch = global.fetch

	beforeAll(() => {
		// Mock fetch for contexts and API calls
		global.fetch = async (url: string) => {
			// Check more specific routes first
			if (url.includes('/formations')) {
				return new Response(JSON.stringify({
					formations: []
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			if (url.includes('/roles')) {
				return new Response(JSON.stringify({
					roles: []
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			if (url.includes('/api/auth/me')) {
				return new Response(JSON.stringify({
					user: { id: 1, email: 'test@example.com', name: 'Test User' }
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			if (url.includes('/api/teams')) {
				return new Response(JSON.stringify({
					teams: [{ id: 1, name: 'Test Team' }]
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			if (url.includes('/api/plays/')) {
				return new Response(JSON.stringify({
					play: {
						id: 1,
						name: 'Test Play',
						teamId: 1,
						playbook_id: 1,
						players: [],
						drawings: []
					}
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			if (url.includes('/preset-routes')) {
				return new Response(JSON.stringify({
					routes: []
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			if (url.includes('/concepts')) {
				return new Response(JSON.stringify({
					concepts: []
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			if (url.includes('/concept-groups')) {
				return new Response(JSON.stringify({
					groups: []
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			return new Response(null, { status: 404 })
		}
	})

	afterEach(() => {
		// Clean up React components after each test
		cleanup()
	})

	afterAll(() => {
		// Restore original fetch
		global.fetch = originalFetch
	})
	test('renders play editor with toolbar', async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		})

		await act(async () => {
			render(
				<QueryClientProvider client={queryClient}>
					<AuthProvider>
						<ThemeProvider>
							<MemoryRouter initialEntries={['/teams/1/playbooks/1/plays/1']}>
								<Routes>
									<Route path="/teams/:teamId/playbooks/:playbookId/plays/:playId" element={<PlayEditorPage />} />
								</Routes>
							</MemoryRouter>
						</ThemeProvider>
					</AuthProvider>
				</QueryClientProvider>
			)
		})

		// Should render the play editor UI
		// Note: This is a basic test - existing canvas tests cover detailed functionality
		await waitFor(() => {
			expect(screen.getByRole('main')).toBeDefined()
		})
	})
})
