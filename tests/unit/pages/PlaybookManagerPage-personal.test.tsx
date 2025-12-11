import { describe, test, expect } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { PlaybookManagerPage } from '../../../src/pages/PlaybookManagerPage'
import { PlaybookProvider } from '../../../src/contexts/PlaybookContext'
import { TeamProvider } from '../../../src/contexts/TeamContext'
import { AuthProvider } from '../../../src/contexts/AuthContext'
import { ThemeProvider } from '../../../src/contexts/ThemeContext'
import { BrowserRouter } from 'react-router-dom'

// Mock successful auth but NO teams (for personal playbooks)
global.fetch = async (url: string, options?: any) => {
	if (url.includes('/api/auth/me')) {
		return {
			ok: true,
			json: async () => ({ user: { id: 1, email: 'test@example.com', name: 'Test User' } })
		} as Response
	}

	if (url.includes('/api/teams')) {
		return {
			ok: true,
			json: async () => ({ teams: [] })  // No teams!
		} as Response
	}

	if (url.includes('/api/playbooks') && options?.method === 'POST') {
		const body = JSON.parse(options.body)
		return {
			ok: true,
			status: 201,
			json: async () => ({
				playbook: {
					id: 123,
					team_id: body.team_id,  // Will be null
					name: body.name,
					description: body.description,
					created_by: 1,
					created_at: new Date(),
					updated_at: new Date()
				}
			})
		} as Response
	}

	if (url.includes('/api/playbooks')) {
		return {
			ok: true,
			json: async () => ({ playbooks: [] })
		} as Response
	}

	return { ok: false, status: 404 } as Response
}

function renderPlaybookManager() {
	return render(
		<BrowserRouter>
			<ThemeProvider>
				<AuthProvider>
					<TeamProvider>
						<PlaybookProvider>
							<PlaybookManagerPage />
						</PlaybookProvider>
					</TeamProvider>
				</AuthProvider>
			</ThemeProvider>
		</BrowserRouter>
	)
}

describe('PlaybookManagerPage - Personal Playbooks', () => {
	test('allows creating personal playbook without a team', async () => {
		const user = userEvent.setup()
		renderPlaybookManager()

		// Wait for page to load
		await waitFor(() => {
			expect(screen.queryByText('Loading playbooks...')).toBeNull()
		})

		// Click "Create Your First Playbook" button
		const createButton = screen.getByText('Create Your First Playbook')
		await user.click(createButton)

		// Wait for modal to open
		await waitFor(() => {
			expect(screen.getByText('Create New Playbook')).toBeDefined()
		})

		// Enter playbook name
		const input = screen.getByPlaceholderText('Enter playbook name...')
		await user.type(input, 'My Personal Playbook')

		// Click Create button in modal
		const modalCreateButton = screen.getByRole('button', { name: 'Create' })
		await user.click(modalCreateButton)

		// Should succeed even without a team
		// (The navigation will happen, so the modal should close)
		await waitFor(() => {
			expect(screen.queryByText('Create New Playbook')).toBeNull()
		}, { timeout: 3000 })
	})
})
