import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { PlaybookProvider, usePlaybook } from './PlaybookContext'
import { TeamProvider } from './TeamContext'
import { act } from 'react'

// Mock fetch
let mockPlaybooks: any[] = []

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

global.fetch = async (url: string, options?: any) => {
	if (url.includes('/api/teams')) {
		return {
			ok: true,
			json: async () => ({
				teams: [{ id: 1, name: 'Team 1' }]
			})
		} as Response
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

function TestComponent() {
	const { playbooks, isLoading, createPlaybook } = usePlaybook()

	if (isLoading) return <div>Loading...</div>

	return (
		<div>
			<div data-testid="playbook-count">{playbooks.length}</div>
			<button onClick={() => createPlaybook('New Playbook', 1)}>
				Create
			</button>
		</div>
	)
}

describe('PlaybookContext', () => {
	test('fetches and provides playbooks', async () => {
		render(
			<TeamProvider>
				<PlaybookProvider>
					<TestComponent />
				</PlaybookProvider>
			</TeamProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('playbook-count').textContent).toBe('1')
		})
	})

	test('allows creating playbooks', async () => {
		render(
			<TeamProvider>
				<PlaybookProvider>
					<TestComponent />
				</PlaybookProvider>
			</TeamProvider>
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
})
