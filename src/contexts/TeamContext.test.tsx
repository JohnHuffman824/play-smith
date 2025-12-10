import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { TeamProvider, useTeam } from './TeamContext'
import { AuthProvider } from './AuthContext'
import { act } from 'react'

const originalFetch = global.fetch

beforeAll(() => {
	// Mock fetch
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
				status: 200,
				json: async () => ({
					teams: [
						{ id: 1, name: 'Team 1', created_at: new Date(), updated_at: new Date() },
						{ id: 2, name: 'Team 2', created_at: new Date(), updated_at: new Date() }
					]
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

afterEach(() => {
	cleanup()
})

function TestComponent() {
	const { teams, currentTeamId, isLoading, switchTeam } = useTeam()

	if (isLoading) return <div>Loading...</div>

	return (
		<div>
			<div data-testid="team-count">{teams.length}</div>
			<div data-testid="current-team">{currentTeamId}</div>
			{teams.map(team => (
				<button key={team.id} onClick={() => switchTeam(team.id)}>
					{team.name}
				</button>
			))}
		</div>
	)
}

describe('TeamContext', () => {
	test('fetches and provides teams', async () => {
		await act(async () => {
			render(
				<AuthProvider>
					<TeamProvider>
						<TestComponent />
					</TeamProvider>
				</AuthProvider>
			)
		})

		await waitFor(() => {
			expect(screen.getByTestId('team-count').textContent).toBe('2')
		})
	})

	test('allows switching teams', async () => {
		await act(async () => {
			render(
				<AuthProvider>
					<TeamProvider>
						<TestComponent />
					</TeamProvider>
				</AuthProvider>
			)
		})

		await waitFor(() => {
			expect(screen.getByText('Team 1')).toBeDefined()
		})

		act(() => {
			screen.getByText('Team 2').click()
		})

		expect(screen.getByTestId('current-team').textContent).toBe('2')
	})
})
