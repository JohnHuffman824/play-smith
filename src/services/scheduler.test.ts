import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { UserRepository } from '../db/repositories/UserRepository'
import { runCleanupNow } from './scheduler'

const playbookRepo = new PlaybookRepository()
const userRepo = new UserRepository()

describe('Scheduler', () => {
	let testUserId: number

	beforeEach(async () => {
		// Create test user
		const user = await userRepo.create({
			email: 'scheduler-test@example.com',
			password_hash: 'test-hash',
			name: 'Scheduler Test User',
		})
		testUserId = user.id
	})

	afterEach(async () => {
		// Cleanup
		await db`DELETE FROM playbooks WHERE created_by = ${testUserId}`
		await db`DELETE FROM users WHERE id = ${testUserId}`
	})

	test('runCleanupNow - deletes old trash playbooks', async () => {
		// Create a playbook and set it as deleted beyond retention period
		const oldPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Old Deleted Playbook',
			created_by: testUserId,
		})

		// Set deleted_at to beyond retention period (TRASH_RETENTION_DAYS + 1)
		await db`
			UPDATE playbooks
			SET deleted_at = datetime('now', '-8 days')
			WHERE id = ${oldPlaybook.id}
		`

		// Verify it exists in trash
		const beforeCleanup = await playbookRepo.findByIdIncludingDeleted(oldPlaybook.id)
		expect(beforeCleanup).not.toBeNull()
		expect(beforeCleanup?.deleted_at).not.toBeNull()

		// Run cleanup
		await runCleanupNow()

		// Verify it's permanently deleted
		const afterCleanup = await playbookRepo.findByIdIncludingDeleted(oldPlaybook.id)
		expect(afterCleanup).toBeNull()
	})

	test('runCleanupNow - does not delete recent trash', async () => {
		// Create a playbook and soft delete it (will be recent)
		const recentPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Recent Deleted Playbook',
			created_by: testUserId,
		})

		await playbookRepo.softDelete(recentPlaybook.id)

		// Verify it exists in trash
		const beforeCleanup = await playbookRepo.findByIdIncludingDeleted(recentPlaybook.id)
		expect(beforeCleanup).not.toBeNull()
		expect(beforeCleanup?.deleted_at).not.toBeNull()

		// Run cleanup
		await runCleanupNow()

		// Verify it still exists (not permanently deleted)
		const afterCleanup = await playbookRepo.findByIdIncludingDeleted(recentPlaybook.id)
		expect(afterCleanup).not.toBeNull()
		expect(afterCleanup?.deleted_at).not.toBeNull()

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${recentPlaybook.id}`
	})

	test('runCleanupNow - does not delete active playbooks', async () => {
		// Create an active playbook (not deleted)
		const activePlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Active Playbook',
			created_by: testUserId,
		})

		// Run cleanup
		await runCleanupNow()

		// Verify it still exists
		const afterCleanup = await playbookRepo.findById(activePlaybook.id)
		expect(afterCleanup).not.toBeNull()
		expect(afterCleanup?.deleted_at).toBeNull()

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${activePlaybook.id}`
	})
})
