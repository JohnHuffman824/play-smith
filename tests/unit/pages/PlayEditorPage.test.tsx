import { describe, test, expect, mock, beforeAll, afterAll, afterEach } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PlayEditorPage } from '../../../src/pages/PlayEditorPage'
import { ThemeProvider } from '../../../src/contexts/ThemeContext'
import { AuthProvider } from '../../../src/contexts/AuthContext'
import { QueryProvider } from '../../../src/providers/QueryProvider'

const originalFetch = global.fetch

function renderPlayEditor(route: string) {
	return render(
		<MemoryRouter initialEntries={[route]}>
			<Routes>
				<Route
					path='/playbooks/:playbookId/play/:playId'
					element={
						<QueryProvider>
							<ThemeProvider>
								<AuthProvider>
									<PlayEditorPage />
								</AuthProvider>
							</ThemeProvider>
						</QueryProvider>
					}
				/>
			</Routes>
		</MemoryRouter>
	)
}

describe('PlayEditorPage - URL Params', () => {

	afterEach(() => {
		cleanup()
	})

	beforeAll(() => {
		// Mock fetch for auth
		global.fetch = async (url: string) => {
			if (url.includes('/api/auth/me')) {
				return new Response(JSON.stringify({
					user: { id: 1, email: 'test@example.com', name: 'Test User' }
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			}
			return new Response(null, { status: 404 })
		}
	})

	afterAll(() => {
		global.fetch = originalFetch
	})

	test('should extract playId from URL params', () => {
		renderPlayEditor('/playbooks/1/play/42')

		// The page should render without the "Team ID is required" error
		expect(screen.queryByText('Team ID is required')).toBeNull()
	})

	test('should show error when playId is missing', () => {
		render(
			<MemoryRouter initialEntries={['/test']}>
				<Routes>
					<Route
						path='/test'
						element={
							<QueryProvider>
								<ThemeProvider>
									<AuthProvider>
										<PlayEditorPage />
									</AuthProvider>
								</ThemeProvider>
							</QueryProvider>
						}
					/>
				</Routes>
			</MemoryRouter>
		)

		expect(
			screen.getByText('Playbook ID and Play ID are required')
		).toBeDefined()
	})
})
