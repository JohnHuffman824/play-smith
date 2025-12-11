import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { TeamRepository } from '../../src/db/repositories/TeamRepository'
import { PlaybookRepository } from '../../src/db/repositories/PlaybookRepository'
import {
	createTestFixture,
	cleanupTestFixture,
	type TestFixtures
} from '../helpers/factories'

describe('Playbook Workflow Integration', () => {
	const teamRepo = new TeamRepository()
	const playbookRepo = new PlaybookRepository()

	let fixture: TestFixtures

	beforeAll(async () => {
		// Create shared fixture (user, team, playbook, session)
		fixture = await createTestFixture()
	})

	afterAll(async () => {
		// Clean up shared fixture
		await cleanupTestFixture(fixture)
	})

	test('complete workflow: user creates team and playbook', async () => {
		// Verify the fixture is set up correctly
		expect(fixture.userId).toBeGreaterThan(0)
		expect(fixture.teamId).toBeGreaterThan(0)
		expect(fixture.playbookId).toBeGreaterThan(0)

		// Verify relationships
		const userTeams = await teamRepo.getUserTeams(fixture.userId)
		expect(userTeams.some(t => t.id === fixture.teamId)).toBe(true)

		const teamPlaybooks = await playbookRepo.getTeamPlaybooks(fixture.teamId)
		expect(teamPlaybooks.some(p => p.id === fixture.playbookId)).toBe(true)
	})
})
