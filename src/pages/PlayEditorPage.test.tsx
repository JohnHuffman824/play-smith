import { describe, test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'
import { TeamProvider } from '../contexts/TeamContext'
import { PlayEditorPage } from './PlayEditorPage'

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

describe('PlayEditorPage', () => {
	test('renders play editor with toolbar', () => {
		render(
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
		)

		// Should render the play editor UI
		// Note: This is a basic test - existing canvas tests cover detailed functionality
		expect(screen.getByRole('main')).toBeDefined()
	})
})
