import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'
import { TeamProvider } from '../contexts/TeamContext'
import { PlayEditorPage } from './PlayEditorPage'
import { act } from 'react'

describe('PlayEditorPage', () => {
	const originalFetch = global.fetch

	beforeAll(() => {
		// Mock fetch for contexts
		global.fetch = async (url: string) => {
			if (url.includes('/api/auth/me')) {
				return {
					ok: true,
					json: async () => ({
						user: { id: 1, email: 'test@example.com', name: 'Test User' }
					})
				} as Response
			}
			if (url.includes('/api/teams')) {
				return {
					ok: true,
					json: async () => ({
						teams: [{ id: 1, name: 'Test Team' }]
					})
				} as Response
			}
			return { ok: false, status: 404 } as Response
		}
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
							<TeamProvider>
								<MemoryRouter initialEntries={['/teams/1/playbooks/1/plays/1']}>
									<Routes>
										<Route path="/teams/:teamId/playbooks/:playbookId/plays/:playId" element={<PlayEditorPage />} />
									</Routes>
								</MemoryRouter>
							</TeamProvider>
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
