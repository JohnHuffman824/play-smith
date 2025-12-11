import { describe, test, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { PlaybookManagerPage } from '../../../src/pages/PlaybookManagerPage'
import { PlaybookProvider } from '../../../src/contexts/PlaybookContext'
import { TeamProvider } from '../../../src/contexts/TeamContext'
import { AuthProvider } from '../../../src/contexts/AuthContext'
import { ThemeProvider } from '../../../src/contexts/ThemeContext'
import { BrowserRouter } from 'react-router-dom'

// Mock successful auth
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
			json: async () => ({
				teams: [{ id: 1, name: 'Test Team', created_by: 1 }]
			})
		} as Response
	}

	if (url.includes('/api/playbooks') && options?.method === 'POST') {
		// Simulate API failure for testing error handling
		return {
			ok: false,
			status: 500,
			json: async () => ({ error: 'Internal server error' })
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

describe('PlaybookManagerPage - Create Playbook Error Handling', () => {
	test('shows error message when playbook creation fails', async () => {
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
		await user.type(input, 'Test Playbook')

		// Click Create button in modal
		const modalCreateButton = screen.getByRole('button', { name: 'Create' })
		await user.click(modalCreateButton)

		// Should show error message
		await waitFor(() => {
			expect(screen.getByText(/Internal server error/i)).toBeDefined()
		}, { timeout: 3000 })

		// Modal should still be open
		expect(screen.getByText('Create New Playbook')).toBeDefined()
	})
})
