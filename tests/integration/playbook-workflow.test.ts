import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { UserRepository } from '../../src/db/repositories/UserRepository';
import { TeamRepository } from '../../src/db/repositories/TeamRepository';
import { PlaybookRepository } from '../../src/db/repositories/PlaybookRepository';
import { db } from '../../src/db/connection';

describe('Playbook Workflow Integration', () => {
	const userRepo = new UserRepository();
	const teamRepo = new TeamRepository();
	const playbookRepo = new PlaybookRepository();

	let userId: number;
	let teamId: number;
	let playbookId: number;

	afterAll(async () => {
		// Cleanup in reverse order due to foreign keys
		if (playbookId) {
			await db`DELETE FROM playbooks WHERE id = ${playbookId}`;
		}
		if (teamId) {
			await db`DELETE FROM teams WHERE id = ${teamId}`;
		}
		if (userId) {
			await db`DELETE FROM users WHERE id = ${userId}`;
		}
	});

	test('complete workflow: user creates team and playbook', async () => {
		// Step 1: Create user
		const user = await userRepo.create({
			email: 'workflow@test.com',
			name: 'Workflow Test',
		});
		userId = user.id;
		expect(user.id).toBeGreaterThan(0);

		// Step 2: Create team
		const team = await teamRepo.create({
			name: 'Workflow Team',
		});
		teamId = team.id;
		expect(team.id).toBeGreaterThan(0);

		// Step 3: Add user to team as owner
		const member = await teamRepo.addMember({
			team_id: teamId,
			user_id: userId,
			role: 'owner',
		});
		expect(member.role).toBe('owner');

		// Step 4: Create playbook
		const playbook = await playbookRepo.create({
			team_id: teamId,
			name: 'Workflow Playbook',
			description: 'Integration test playbook',
			created_by: userId,
		});
		playbookId = playbook.id;
		expect(playbook.id).toBeGreaterThan(0);

		// Step 5: Verify relationships
		const userTeams = await teamRepo.getUserTeams(userId);
		expect(userTeams.some(t => t.id === teamId)).toBe(true);

		const teamPlaybooks = await playbookRepo.getTeamPlaybooks(teamId);
		expect(teamPlaybooks.some(p => p.id === playbookId)).toBe(true);
	});
});
