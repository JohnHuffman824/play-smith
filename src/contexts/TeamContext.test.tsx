import { describe, test, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { TeamProvider, useTeam } from './TeamContext'
import { act } from 'react'

// Mock fetch
global.fetch = async (url: string) => {
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
		render(
			<TeamProvider>
				<TestComponent />
			</TeamProvider>
		)

		await waitFor(() => {
			expect(screen.getByTestId('team-count').textContent).toBe('2')
		})
	})

	test('allows switching teams', async () => {
		render(
			<TeamProvider>
				<TestComponent />
			</TeamProvider>
		)

		await waitFor(() => {
			expect(screen.getByText('Team 1')).toBeDefined()
		})

		act(() => {
			screen.getByText('Team 2').click()
		})

		expect(screen.getByTestId('current-team').textContent).toBe('2')
	})
})
