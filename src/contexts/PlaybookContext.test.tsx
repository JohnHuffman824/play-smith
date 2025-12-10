import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { PlaybookProvider, usePlaybook } from './PlaybookContext'
import { TeamProvider } from './TeamContext'
import { AuthProvider } from './AuthContext'
import { act } from 'react'

// Mock fetch
let mockPlaybooks: any[] = []
const originalFetch = global.fetch

beforeAll(() => {
	global.fetch = async (url: string, options?: any) => {
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
				teams: [{ id: 1, name: 'Team 1' }]
			})
		} as Response
	}

	if (url.includes('/api/playbooks/') && options?.method === 'PUT') {
		const id = parseInt(url.split('/').pop()!)
		const body = await options.body
		const updates = JSON.parse(body)
		const playbookIndex = mockPlaybooks.findIndex(pb => pb.id === id)
		if (playbookIndex !== -1) {
			mockPlaybooks[playbookIndex] = {
				...mockPlaybooks[playbookIndex],
				...updates,
				updated_at: new Date()
			}
			return {
				ok: true,
				json: async () => ({ playbook: mockPlaybooks[playbookIndex] })
			} as Response
		}
		return { ok: false, status: 404 } as Response
	}

	if (url.includes('/api/playbooks/') && options?.method === 'DELETE') {
		const id = parseInt(url.split('/').pop()!)
		const playbookIndex = mockPlaybooks.findIndex(pb => pb.id === id)
		if (playbookIndex !== -1) {
			mockPlaybooks.splice(playbookIndex, 1)
			return {
				ok: true,
				json: async () => ({ success: true })
			} as Response
		}
		return { ok: false, status: 404 } as Response
	}

	if (url.includes('/api/playbooks') && options?.method === 'POST') {
		const body = await options.body
		const data = JSON.parse(body)
		const newPlaybook = {
			id: Date.now(),
			...data,
			created_by: 1,
			created_at: new Date(),
			updated_at: new Date()
		}
		mockPlaybooks.push(newPlaybook)
		return {
			ok: true,
			status: 201,
			json: async () => ({ playbook: newPlaybook })
		} as Response
	}

	if (url.includes('/api/playbooks')) {
		return {
			ok: true,
			json: async () => ({ playbooks: [...mockPlaybooks] })
		} as Response
	}

	return { ok: false, status: 404 } as Response
	}
})

afterAll(() => {
	// Restore original fetch
	global.fetch = originalFetch
})

beforeEach(() => {
	// Reset mock data before each test
	mockPlaybooks = [
		{
			id: 1,
			team_id: 1,
			name: 'Playbook 1',
			description: null,
			created_by: 1,
			created_at: new Date(),
			updated_at: new Date()
		}
	]
})

afterEach(() => {
	cleanup()
})

function TestComponent() {
	const { playbooks, isLoading, createPlaybook, updatePlaybook, deletePlaybook } =
		usePlaybook()

	if (isLoading) return <div>Loading...</div>

	return (
		<div>
			<div data-testid="playbook-count">{playbooks.length}</div>
			{playbooks.map(pb => (
				<div key={pb.id} data-testid={`playbook-${pb.id}`}>
					{pb.name}
				</div>
			))}
			<button onClick={() => createPlaybook('New Playbook', 1)}>Create</button>
			<button
				onClick={() =>
					playbooks[0] && updatePlaybook(playbooks[0].id, { name: 'Updated' })
				}
			>
				Update
			</button>
			<button onClick={() => playbooks[0] && deletePlaybook(playbooks[0].id)}>
				Delete
			</button>
		</div>
	)
}

describe('PlaybookContext', () => {
	test('fetches and provides playbooks', async () => {
		render(
			<AuthProvider>
				<TeamProvider>
					<PlaybookProvider>
						<TestComponent />
					</PlaybookProvider>
				</TeamProvider>
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('playbook-count').textContent).toBe('1')
		})
	})

	test('allows creating playbooks', async () => {
		render(
			<AuthProvider>
				<TeamProvider>
					<PlaybookProvider>
						<TestComponent />
					</PlaybookProvider>
				</TeamProvider>
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByText('Create')).toBeDefined()
		})

		await act(async () => {
			screen.getByText('Create').click()
		})

		await waitFor(() => {
			expect(screen.getByTestId('playbook-count').textContent).toBe('2')
		})
	})

	test('allows updating playbooks', async () => {
		render(
			<AuthProvider>
				<TeamProvider>
					<PlaybookProvider>
						<TestComponent />
					</PlaybookProvider>
				</TeamProvider>
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByText('Playbook 1')).toBeDefined()
		})

		await act(async () => {
			screen.getByText('Update').click()
		})

		await waitFor(() => {
			expect(screen.getByText('Updated')).toBeDefined()
		})
	})

	test('allows deleting playbooks', async () => {
		render(
			<AuthProvider>
				<TeamProvider>
					<PlaybookProvider>
						<TestComponent />
					</PlaybookProvider>
				</TeamProvider>
			</AuthProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('playbook-count').textContent).toBe('1')
		})

		await act(async () => {
			screen.getByText('Delete').click()
		})

		await waitFor(() => {
			expect(screen.getByTestId('playbook-count').textContent).toBe('0')
		})
	})
})
