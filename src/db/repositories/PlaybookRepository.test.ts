import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { PlaybookRepository } from './PlaybookRepository';
import { TeamRepository } from './TeamRepository';
import { UserRepository } from './UserRepository';
import { db } from '../connection';

describe('PlaybookRepository', () => {
	const playbookRepo = new PlaybookRepository();
	const teamRepo = new TeamRepository();
	const userRepo = new UserRepository();

	let testPlaybookId: number;
	let testTeamId: number;
	let testUserId: number;

	beforeAll(async () => {
		const user = await userRepo.create({
			email: 'playbook-test@example.com',
			name: 'Playbook Test User',
		});
		testUserId = user.id;

		const team = await teamRepo.create({
			name: 'Playbook Test Team',
		});
		testTeamId = team.id;
	});

	afterAll(async () => {
		if (testPlaybookId) {
			await db`DELETE FROM playbooks WHERE id = ${testPlaybookId}`;
		}
		if (testTeamId) {
			await db`DELETE FROM teams WHERE id = ${testTeamId}`;
		}
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`;
		}
	});

	test('create playbook', async () => {
		const playbook = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Test Playbook',
			description: 'A test playbook',
			created_by: testUserId,
		});

		expect(playbook.id).toBeGreaterThan(0);
		expect(playbook.name).toBe('Test Playbook');
		expect(playbook.team_id).toBe(testTeamId);

		testPlaybookId = playbook.id;
	});

	test('get team playbooks', async () => {
		const playbooks = await playbookRepo.getTeamPlaybooks(testTeamId);

		expect(playbooks.length).toBeGreaterThan(0);
		expect(playbooks[0].id).toBe(testPlaybookId);
	});

	test('update playbook', async () => {
		const updated = await playbookRepo.update(testPlaybookId, {
			name: 'Updated Playbook',
		});

		expect(updated?.name).toBe('Updated Playbook');
	});
});
