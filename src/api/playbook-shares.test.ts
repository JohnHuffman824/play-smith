import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { startTestServer, stopTestServer } from '../../tests/helpers/test-server'
import {
	createTestFixture,
	cleanupTestFixture,
	cleanupTestData,
	createTestTeam,
	addTeamMember,
	type TestFixtures
} from '../../tests/helpers/factories'

describe('Playbook Shares API', () => {
	let fixture: TestFixtures
	let baseUrl: string
	let team2Id: number

	beforeAll(async () => {
		// Start test server once
		const { url } = await startTestServer()
		baseUrl = url

		// Create shared fixture (user, team, playbook, session)
		fixture = await createTestFixture()

		// Create a second team for testing sharing
		const team2 = await createTestTeam({ name: 'Test Team 2' })
		team2Id = team2.id

		// Add the test user to team2
		await addTeamMember(team2Id, fixture.userId, 'editor')
	})

	afterAll(async () => {
		// Clean up second team
		await db`DELETE FROM team_members WHERE team_id = ${team2Id}`
		await db`DELETE FROM teams WHERE id = ${team2Id}`

		// Clean up shared fixture
		await cleanupTestFixture(fixture)
		await stopTestServer()
	})

	afterEach(async () => {
		// Clean up shares between tests
		await db`DELETE FROM playbook_shares WHERE playbook_id = ${fixture.playbookId}`
	})

	test('GET /api/playbooks/:id/shares returns empty array when no shares', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.shares).toBeArray()
		expect(data.shares.length).toBe(0)
	})

	test('GET /api/playbooks/:id/shares returns 401 when not authenticated', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`)

		expect(response.status).toBe(401)
	})

	test('GET /api/playbooks/:id/shares returns 404 for non-existent playbook', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/99999/shares`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(404)
	})

	test('POST /api/playbooks/:id/shares creates a share', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: team2Id,
				permission: 'view'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.share).toBeDefined()
		expect(data.share.playbook_id).toBe(fixture.playbookId)
		expect(data.share.shared_with_team_id).toBe(team2Id)
		expect(data.share.permission).toBe('view')

		// Verify share was created
		const listResponse = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})
		const listData = await listResponse.json()
		expect(listData.shares.length).toBe(1)
		expect(listData.shares[0].team_name).toBe('Test Team 2')
	})

	test('POST /api/playbooks/:id/shares with edit permission', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: team2Id,
				permission: 'edit'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.share.permission).toBe('edit')
	})

	test('POST /api/playbooks/:id/shares defaults to view permission', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: team2Id
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.share.permission).toBe('view')
	})

	test('POST /api/playbooks/:id/shares updates existing share', async () => {
		// Create initial share with view permission
		await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: team2Id,
				permission: 'view'
			})
		})

		// Update to edit permission
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: team2Id,
				permission: 'edit'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.share.permission).toBe('edit')

		// Verify only one share exists
		const listResponse = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})
		const listData = await listResponse.json()
		expect(listData.shares.length).toBe(1)
	})

	test('POST /api/playbooks/:id/shares returns 400 when team_id is missing', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				permission: 'view'
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toContain('team_id')
	})

	test('POST /api/playbooks/:id/shares returns 400 for invalid permission', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: team2Id,
				permission: 'admin'
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toContain('permission')
	})

	test('POST /api/playbooks/:id/shares returns 403 for team user is not member of', async () => {
		// Create a third team that the user is not a member of
		const team3 = await createTestTeam({ name: 'Test Team 3' })

		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: team3.id,
				permission: 'view'
			})
		})

		expect(response.status).toBe(403)

		// Cleanup
		await db`DELETE FROM teams WHERE id = ${team3.id}`
	})

	test('POST /api/playbooks/:id/shares returns 400 when sharing with own team', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: fixture.teamId,
				permission: 'view'
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toContain('own team')
	})

	test('DELETE /api/playbooks/:id/shares/:teamId removes a share', async () => {
		// Create a share first
		await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			method: 'POST',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				team_id: team2Id,
				permission: 'view'
			})
		})

		// Delete the share
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares/${team2Id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(204)

		// Verify share was deleted
		const listResponse = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})
		const listData = await listResponse.json()
		expect(listData.shares.length).toBe(0)
	})

	test('DELETE /api/playbooks/:id/shares/:teamId returns 401 when not authenticated', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares/${team2Id}`, {
			method: 'DELETE'
		})

		expect(response.status).toBe(401)
	})

	test('DELETE /api/playbooks/:id/shares/:teamId returns 404 for non-existent playbook', async () => {
		const response = await fetch(`${baseUrl}/api/playbooks/99999/shares/${team2Id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(404)
	})

	test('DELETE /api/playbooks/:id/shares/:teamId handles non-existent share gracefully', async () => {
		// Try to delete a share that doesn't exist
		const response = await fetch(`${baseUrl}/api/playbooks/${fixture.playbookId}/shares/${team2Id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		// Should still return 204
		expect(response.status).toBe(204)
	})
})
