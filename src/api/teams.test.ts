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

describe('Teams API', () => {
	let fixture: TestFixtures
	let baseUrl: string

	beforeAll(async () => {
		// Start test server once
		const { url } = await startTestServer()
		baseUrl = url

		// Create shared fixture (user, team, playbook, session)
		fixture = await createTestFixture()
	})

	afterAll(async () => {
		// Clean up shared fixture
		await cleanupTestFixture(fixture)
		await stopTestServer()
	})

	afterEach(async () => {
		// Clean up test-specific data between tests
		await cleanupTestData(fixture.playbookId)
	})

	test('GET /api/teams returns user teams', async () => {
		// Create additional team
		const team2 = await createTestTeam()
		await addTeamMember(team2.id, fixture.userId, 'editor')

		const response = await fetch(`${baseUrl}/api/teams`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.teams).toBeArray()
		expect(data.teams.length).toBe(2)

		// Cleanup additional team
		await db`DELETE FROM team_members WHERE team_id = ${team2.id}`
		await db`DELETE FROM teams WHERE id = ${team2.id}`
	})

	test('GET /api/teams accepts session_token cookie', async () => {
		const response = await fetch(`${baseUrl}/api/teams`, {
			headers: { Cookie: `session_token=${fixture.sessionToken}` }
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.teams).toBeArray()
		expect(data.teams.length).toBe(1)
		expect(data.teams[0].id).toBe(fixture.teamId)
	})
})
