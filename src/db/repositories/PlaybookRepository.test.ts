import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { PlaybookRepository } from './PlaybookRepository'
import { TeamRepository } from './TeamRepository'
import { UserRepository } from './UserRepository'
import { db } from '../connection'

describe('PlaybookRepository', () => {
	const playbookRepo = new PlaybookRepository()
	const teamRepo = new TeamRepository()
	const userRepo = new UserRepository()

	let testPlaybookId: number
	let testTeamId: number
	let testUserId: number

	beforeAll(async () => {
		const user = await userRepo.create({
			email: 'playbook-test@example.com',
			name: 'Playbook Test User',
			password_hash: '$2a$10$test.hash.placeholder',
		})
		testUserId = user.id

		const team = await teamRepo.create({
			name: 'Playbook Test Team',
		})
		testTeamId = team.id
	})

	afterAll(async () => {
		// Delete in correct order to avoid foreign key constraints
		// Delete all playbooks for the user (not just testPlaybookId)
		if (testUserId) {
			await db`DELETE FROM playbooks WHERE created_by = ${testUserId}`
		}
		if (testPlaybookId) {
			await db`DELETE FROM playbooks WHERE id = ${testPlaybookId}`
		}
		// Delete sessions for the user
		if (testUserId) {
			await db`DELETE FROM sessions WHERE user_id = ${testUserId}`
		}
		if (testTeamId) {
			await db`DELETE FROM teams WHERE id = ${testTeamId}`
		}
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`
		}
	})

	test('create playbook', async () => {
		const playbook = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Test Playbook',
			description: 'A test playbook',
			created_by: testUserId,
		})

		expect(playbook.id).toBeGreaterThan(0)
		expect(playbook.name).toBe('Test Playbook')
		expect(playbook.team_id).toBe(testTeamId)

		testPlaybookId = playbook.id
	})

	test('get team playbooks', async () => {
		const playbooks = await playbookRepo.getTeamPlaybooks(testTeamId)

		expect(playbooks.length).toBeGreaterThan(0)
		expect(playbooks[0].id).toBe(testPlaybookId)
	})

	test('update playbook', async () => {
		const updated = await playbookRepo.update(testPlaybookId, {
			name: 'Updated Playbook',
		})

		expect(updated?.name).toBe('Updated Playbook')
	})

	test('create personal playbook (team_id: null)', async () => {
		const personalPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Personal Playbook',
			description: 'A personal playbook',
			created_by: testUserId,
		})

		expect(personalPlaybook.id).toBeGreaterThan(0)
		expect(personalPlaybook.name).toBe('Personal Playbook')
		expect(personalPlaybook.team_id).toBeNull()
		expect(personalPlaybook.created_by).toBe(testUserId)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${personalPlaybook.id}`
	})

	test('fetch personal playbooks for a user', async () => {
		// Create a personal playbook
		const personalPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'My Personal Playbook',
			description: 'Personal only',
			created_by: testUserId,
		})

		const personalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(testUserId)

		expect(personalPlaybooks.length).toBeGreaterThan(0)
		expect(personalPlaybooks.some((p) => p.id === personalPlaybook.id)).toBe(true)
		expect(personalPlaybooks.every((p) => p.team_id === null)).toBe(true)
		expect(personalPlaybooks.every((p) => p.created_by === testUserId)).toBe(true)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${personalPlaybook.id}`
	})

	test('personal playbooks are filtered by created_by', async () => {
		// Create another user
		const otherUser = await userRepo.create({
			email: 'other-user@example.com',
			name: 'Other User',
			password_hash: '$2a$10$test.hash.placeholder',
		})

		// Create personal playbooks for both users
		const userPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'User Playbook',
			created_by: testUserId,
		})

		const otherPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Other Playbook',
			created_by: otherUser.id,
		})

		// Fetch personal playbooks for testUserId
		const userPersonalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(testUserId)

		// Should only contain playbooks created by testUserId
		expect(userPersonalPlaybooks.every((p) => p.created_by === testUserId)).toBe(true)
		expect(userPersonalPlaybooks.some((p) => p.id === userPlaybook.id)).toBe(true)
		expect(userPersonalPlaybooks.some((p) => p.id === otherPlaybook.id)).toBe(false)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${userPlaybook.id}`
		await db`DELETE FROM playbooks WHERE id = ${otherPlaybook.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('personal playbooks are ordered by most recent first', async () => {
		// Create multiple personal playbooks with delays to ensure different timestamps
		const playbook1 = await playbookRepo.create({
			team_id: null,
			name: 'First Playbook',
			created_by: testUserId,
		})

		// Add delay to ensure different timestamps (SQLite CURRENT_TIMESTAMP resolution)
		await new Promise((resolve) => setTimeout(resolve, 50))

		const playbook2 = await playbookRepo.create({
			team_id: null,
			name: 'Second Playbook',
			created_by: testUserId,
		})

		await new Promise((resolve) => setTimeout(resolve, 50))

		const playbook3 = await playbookRepo.create({
			team_id: null,
			name: 'Third Playbook',
			created_by: testUserId,
		})

		const personalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(testUserId)

		// Find the indices of our test playbooks
		const index1 = personalPlaybooks.findIndex((p) => p.id === playbook1.id)
		const index2 = personalPlaybooks.findIndex((p) => p.id === playbook2.id)
		const index3 = personalPlaybooks.findIndex((p) => p.id === playbook3.id)

		// Most recent (playbook3) should come before older ones
		expect(index3).toBeLessThan(index2)
		expect(index2).toBeLessThan(index1)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook1.id}`
		await db`DELETE FROM playbooks WHERE id = ${playbook2.id}`
		await db`DELETE FROM playbooks WHERE id = ${playbook3.id}`
	})

	test('update playbook with folder_id - set folder', async () => {
		// Create a folder for the user
		const [folder] = await db<Array<{ id: number }>>`
			INSERT INTO folders (user_id, name)
			VALUES (${testUserId}, 'Test Folder')
			RETURNING id
		`

		const updated = await playbookRepo.update(testPlaybookId, {
			folder_id: folder.id,
		})

		expect(updated?.folder_id).toBe(folder.id)

		// Cleanup
		await db`DELETE FROM folders WHERE id = ${folder.id}`
	})

	test('update playbook with folder_id - clear folder', async () => {
		// First set a folder
		const [folder] = await db<Array<{ id: number }>>`
			INSERT INTO folders (user_id, name)
			VALUES (${testUserId}, 'Temp Folder')
			RETURNING id
		`

		await playbookRepo.update(testPlaybookId, {
			folder_id: folder.id,
		})

		// Now clear it
		const updated = await playbookRepo.update(testPlaybookId, {
			folder_id: null,
		})

		expect(updated?.folder_id).toBeNull()

		// Cleanup
		await db`DELETE FROM folders WHERE id = ${folder.id}`
	})

	test('update playbook with folder_id - unchanged when not provided', async () => {
		// First set a folder
		const [folder] = await db<Array<{ id: number }>>`
			INSERT INTO folders (user_id, name)
			VALUES (${testUserId}, 'Persistent Folder')
			RETURNING id
		`

		await playbookRepo.update(testPlaybookId, {
			folder_id: folder.id,
		})

		// Update name without touching folder_id
		const updated = await playbookRepo.update(testPlaybookId, {
			name: 'New Name',
		})

		expect(updated?.folder_id).toBe(folder.id)
		expect(updated?.name).toBe('New Name')

		// Cleanup
		await db`DELETE FROM folders WHERE id = ${folder.id}`
	})

	test('toggleStar - star an unstarred playbook', async () => {
		// Create a new playbook (default is_starred = false)
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Unstarred Playbook',
			created_by: testUserId,
		})

		// Verify it starts unstarred (PostgreSQL returns 0 for false)
		expect(playbook.is_starred).toBeFalsy()

		// Toggle to starred
		const starred = await playbookRepo.toggleStar(playbook.id)

		expect(starred).not.toBeNull()
		expect(starred?.is_starred).toBeTruthy()
		expect(starred?.id).toBe(playbook.id)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	test('toggleStar - unstar a starred playbook', async () => {
		// Create a new playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Starred Playbook',
			created_by: testUserId,
		})

		// Star it first
		await playbookRepo.toggleStar(playbook.id)

		// Verify it's starred (PostgreSQL returns 1 for true)
		const starredPlaybook = await playbookRepo.findById(playbook.id)
		expect(starredPlaybook?.is_starred).toBeTruthy()

		// Toggle to unstarred
		const unstarred = await playbookRepo.toggleStar(playbook.id)

		expect(unstarred).not.toBeNull()
		expect(unstarred?.is_starred).toBeFalsy()
		expect(unstarred?.id).toBe(playbook.id)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	test('toggleStar - multiple toggles work correctly', async () => {
		// Create a new playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Toggle Test Playbook',
			created_by: testUserId,
		})

		// Initial state: unstarred (PostgreSQL returns 0 for false)
		expect(playbook.is_starred).toBeFalsy()

		// First toggle: star
		const toggle1 = await playbookRepo.toggleStar(playbook.id)
		expect(toggle1?.is_starred).toBeTruthy()

		// Second toggle: unstar
		const toggle2 = await playbookRepo.toggleStar(playbook.id)
		expect(toggle2?.is_starred).toBeFalsy()

		// Third toggle: star again
		const toggle3 = await playbookRepo.toggleStar(playbook.id)
		expect(toggle3?.is_starred).toBeTruthy()

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	test('toggleStar - returns null for non-existent playbook', async () => {
		const nonExistentId = 999999999
		const result = await playbookRepo.toggleStar(nonExistentId)

		expect(result).toBeNull()
	})

	test('updateLastAccessed - sets last_accessed_at timestamp', async () => {
		// Create a new playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Last Accessed Test Playbook',
			created_by: testUserId,
		})

		// Verify last_accessed_at is initially null
		expect(playbook.last_accessed_at).toBeNull()

		// Update last_accessed_at
		await playbookRepo.updateLastAccessed(playbook.id)

		// Fetch the playbook and verify timestamp is set
		const updated = await playbookRepo.findById(playbook.id)
		expect(updated?.last_accessed_at).not.toBeNull()

		// Verify the timestamp is a valid date (could be Date or string depending on DB driver)
		const timestamp = updated?.last_accessed_at
		if (timestamp instanceof Date) {
			expect(timestamp.getTime()).toBeGreaterThan(0)
		} else if (typeof timestamp === 'string') {
			expect(new Date(timestamp).getTime()).toBeGreaterThan(0)
		}

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	test('updateLastAccessed - updates existing timestamp', async () => {
		// Create a new playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Last Accessed Update Test',
			created_by: testUserId,
		})

		// Set initial timestamp
		await playbookRepo.updateLastAccessed(playbook.id)
		const first = await playbookRepo.findById(playbook.id)
		const firstTimestamp = first?.last_accessed_at

		// Wait a full second to ensure different timestamp (PostgreSQL second precision)
		await new Promise((resolve) => setTimeout(resolve, 1100))

		// Update timestamp again
		await playbookRepo.updateLastAccessed(playbook.id)
		const second = await playbookRepo.findById(playbook.id)
		const secondTimestamp = second?.last_accessed_at

		// Verify timestamp was updated (handle both Date and string formats)
		expect(firstTimestamp).not.toBeNull()
		expect(secondTimestamp).not.toBeNull()

		const firstTime = firstTimestamp instanceof Date
			? firstTimestamp.getTime()
			: new Date(firstTimestamp as string).getTime()
		const secondTime = secondTimestamp instanceof Date
			? secondTimestamp.getTime()
			: new Date(secondTimestamp as string).getTime()

		expect(secondTime).toBeGreaterThan(firstTime)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	test('updateLastAccessed - does not fail for non-existent playbook', async () => {
		const nonExistentId = 999999999
		// Should not throw an error
		await expect(playbookRepo.updateLastAccessed(nonExistentId)).resolves.toBeUndefined()
	})

	// Soft Delete Tests
	test('softDelete - marks playbook as deleted', async () => {
		// Create a new playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Soft Delete Test Playbook',
			created_by: testUserId,
		})

		// Verify deleted_at is initially null
		expect(playbook.deleted_at).toBeNull()

		// Soft delete the playbook
		await playbookRepo.softDelete(playbook.id)

		// Fetch the playbook and verify deleted_at is set
		const deleted = await playbookRepo.findById(playbook.id)
		expect(deleted?.deleted_at).not.toBeNull()

		// Verify the timestamp is valid
		const timestamp = deleted?.deleted_at
		if (timestamp instanceof Date) {
			expect(timestamp.getTime()).toBeGreaterThan(0)
		} else if (typeof timestamp === 'string') {
			expect(new Date(timestamp).getTime()).toBeGreaterThan(0)
		}

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	test('restore - unmarks playbook as deleted', async () => {
		// Create and soft delete a playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Restore Test Playbook',
			created_by: testUserId,
		})

		await playbookRepo.softDelete(playbook.id)

		// Verify it's deleted
		const deleted = await playbookRepo.findById(playbook.id)
		expect(deleted?.deleted_at).not.toBeNull()

		// Restore the playbook
		const restored = await playbookRepo.restore(playbook.id)

		expect(restored).not.toBeNull()
		expect(restored?.deleted_at).toBeNull()
		expect(restored?.id).toBe(playbook.id)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	test('restore - returns null for non-existent playbook', async () => {
		const nonExistentId = 999999999
		const result = await playbookRepo.restore(nonExistentId)

		expect(result).toBeNull()
	})

	test('permanentDelete - physically removes playbook', async () => {
		// Create a playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Permanent Delete Test',
			created_by: testUserId,
		})

		// Verify it exists
		const exists = await playbookRepo.findById(playbook.id)
		expect(exists).not.toBeNull()

		// Permanently delete it
		await playbookRepo.permanentDelete(playbook.id)

		// Verify it's gone
		const gone = await playbookRepo.findById(playbook.id)
		expect(gone).toBeNull()
	})

	test('emptyTrash - deletes all trashed playbooks for user', async () => {
		// Create multiple playbooks and soft delete them
		const playbook1 = await playbookRepo.create({
			team_id: null,
			name: 'Trash 1',
			created_by: testUserId,
		})

		const playbook2 = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Trash 2',
			created_by: testUserId,
		})

		const playbook3 = await playbookRepo.create({
			team_id: null,
			name: 'Trash 3',
			created_by: testUserId,
		})

		// Soft delete all three
		await playbookRepo.softDelete(playbook1.id)
		await playbookRepo.softDelete(playbook2.id)
		await playbookRepo.softDelete(playbook3.id)

		// Empty trash
		const deletedCount = await playbookRepo.emptyTrash(testUserId, [testTeamId])

		expect(deletedCount).toBeGreaterThanOrEqual(3)

		// Verify they're permanently gone
		const gone1 = await playbookRepo.findById(playbook1.id)
		const gone2 = await playbookRepo.findById(playbook2.id)
		const gone3 = await playbookRepo.findById(playbook3.id)

		expect(gone1).toBeNull()
		expect(gone2).toBeNull()
		expect(gone3).toBeNull()
	})

	test('emptyTrash - only deletes trashed playbooks, not active ones', async () => {
		// Create two playbooks: one active, one trashed
		const activePlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Active Playbook',
			created_by: testUserId,
		})

		const trashedPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Trashed Playbook',
			created_by: testUserId,
		})

		// Only soft delete the second one
		await playbookRepo.softDelete(trashedPlaybook.id)

		// Empty trash
		await playbookRepo.emptyTrash(testUserId, [testTeamId])

		// Verify active playbook still exists
		const active = await playbookRepo.findById(activePlaybook.id)
		expect(active).not.toBeNull()

		// Verify trashed playbook is gone
		const trashed = await playbookRepo.findById(trashedPlaybook.id)
		expect(trashed).toBeNull()

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${activePlaybook.id}`
	})

	test('cleanupOldTrash - deletes playbooks older than 30 days', async () => {
		// Create a playbook and manually set deleted_at to 31 days ago
		const oldPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Old Trash',
			created_by: testUserId,
		})

		// Set deleted_at to 31 days ago (works for both SQLite and PostgreSQL)
		await db`
			UPDATE playbooks
			SET deleted_at = datetime('now', '-31 days')
			WHERE id = ${oldPlaybook.id}
		`

		// Verify it was set
		const old = await playbookRepo.findById(oldPlaybook.id)
		expect(old?.deleted_at).not.toBeNull()

		// Cleanup old trash
		const deletedCount = await playbookRepo.cleanupOldTrash()

		expect(deletedCount).toBeGreaterThanOrEqual(1)

		// Verify it's gone
		const gone = await playbookRepo.findById(oldPlaybook.id)
		expect(gone).toBeNull()
	})

	test('cleanupOldTrash - does not delete recent trash', async () => {
		// Create a playbook and soft delete it (will be recent)
		const recentPlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Recent Trash',
			created_by: testUserId,
		})

		await playbookRepo.softDelete(recentPlaybook.id)

		// Cleanup old trash
		await playbookRepo.cleanupOldTrash()

		// Verify recent trash still exists (use direct query since findById excludes deleted)
		const [recent] = await db<Array<{ id: number; deleted_at: any }>>`
			SELECT id, deleted_at FROM playbooks WHERE id = ${recentPlaybook.id}
		`
		expect(recent).not.toBeUndefined()
		expect(recent?.deleted_at).not.toBeNull()

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${recentPlaybook.id}`
	})

	test('getTrashedPlaybooks - fetches only deleted playbooks', async () => {
		// Create playbooks: some active, some deleted
		const activePlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Active',
			created_by: testUserId,
		})

		const deletedPlaybook1 = await playbookRepo.create({
			team_id: null,
			name: 'Deleted 1',
			created_by: testUserId,
		})

		const deletedPlaybook2 = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Deleted 2',
			created_by: testUserId,
		})

		// Soft delete two of them
		await playbookRepo.softDelete(deletedPlaybook1.id)
		await playbookRepo.softDelete(deletedPlaybook2.id)

		// Fetch trashed playbooks
		const trashed = await playbookRepo.getTrashedPlaybooks(testUserId, [testTeamId])

		// Verify only deleted playbooks are returned
		expect(trashed.some((p) => p.id === activePlaybook.id)).toBe(false)
		expect(trashed.some((p) => p.id === deletedPlaybook1.id)).toBe(true)
		expect(trashed.some((p) => p.id === deletedPlaybook2.id)).toBe(true)
		expect(trashed.every((p) => p.deleted_at !== null)).toBe(true)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${activePlaybook.id}`
		await db`DELETE FROM playbooks WHERE id = ${deletedPlaybook1.id}`
		await db`DELETE FROM playbooks WHERE id = ${deletedPlaybook2.id}`
	})

	test('getTrashedPlaybooks - includes play_count', async () => {
		// Create a deleted playbook with plays
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Deleted with Plays',
			created_by: testUserId,
		})

		// Add a play to it (using correct columns)
		await db`
			INSERT INTO plays (playbook_id, name, created_by)
			VALUES (${playbook.id}, 'Test Play', ${testUserId})
		`

		// Soft delete it
		await playbookRepo.softDelete(playbook.id)

		// Fetch trashed playbooks
		const trashed = await playbookRepo.getTrashedPlaybooks(testUserId, [testTeamId])

		const trashedPlaybook = trashed.find((p) => p.id === playbook.id)
		expect(trashedPlaybook).not.toBeUndefined()
		expect(trashedPlaybook?.play_count).toBeGreaterThanOrEqual(1)

		// Cleanup
		await db`DELETE FROM plays WHERE playbook_id = ${playbook.id}`
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	// Tests for exclusion of deleted playbooks from query methods
	test('findById - excludes deleted playbooks', async () => {
		// Create and soft delete a playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Deleted Playbook',
			created_by: testUserId,
		})

		// Verify it exists before deletion
		const existsBefore = await playbookRepo.findById(playbook.id)
		expect(existsBefore).not.toBeNull()

		// Soft delete it
		await playbookRepo.softDelete(playbook.id)

		// Try to find it - should return null
		const existsAfter = await playbookRepo.findById(playbook.id)
		expect(existsAfter).toBeNull()

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})

	test('getTeamPlaybooks - excludes deleted playbooks', async () => {
		// Create two team playbooks
		const playbook1 = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Team Playbook Active',
			created_by: testUserId,
		})

		const playbook2 = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Team Playbook Deleted',
			created_by: testUserId,
		})

		// Soft delete the second one
		await playbookRepo.softDelete(playbook2.id)

		// Fetch team playbooks
		const teamPlaybooks = await playbookRepo.getTeamPlaybooks(testTeamId)

		// Should include active playbook but not deleted one
		expect(teamPlaybooks.some((p) => p.id === playbook1.id)).toBe(true)
		expect(teamPlaybooks.some((p) => p.id === playbook2.id)).toBe(false)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook1.id}`
		await db`DELETE FROM playbooks WHERE id = ${playbook2.id}`
	})

	test('getUserPersonalPlaybooks - excludes deleted playbooks', async () => {
		// Create two personal playbooks
		const playbook1 = await playbookRepo.create({
			team_id: null,
			name: 'Personal Active',
			created_by: testUserId,
		})

		const playbook2 = await playbookRepo.create({
			team_id: null,
			name: 'Personal Deleted',
			created_by: testUserId,
		})

		// Soft delete the second one
		await playbookRepo.softDelete(playbook2.id)

		// Fetch personal playbooks
		const personalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(testUserId)

		// Should include active playbook but not deleted one
		expect(personalPlaybooks.some((p) => p.id === playbook1.id)).toBe(true)
		expect(personalPlaybooks.some((p) => p.id === playbook2.id)).toBe(false)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook1.id}`
		await db`DELETE FROM playbooks WHERE id = ${playbook2.id}`
	})

	test('getUserPlaybooksWithCounts - excludes deleted playbooks', async () => {
		// Create two playbooks: one active, one deleted
		const activePlaybook = await playbookRepo.create({
			team_id: null,
			name: 'Active Playbook for Count',
			created_by: testUserId,
		})

		const deletedPlaybook = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Deleted Playbook for Count',
			created_by: testUserId,
		})

		// Soft delete the second one
		await playbookRepo.softDelete(deletedPlaybook.id)

		// Fetch playbooks with counts
		const playbooks = await playbookRepo.getUserPlaybooksWithCounts(testUserId, [testTeamId])

		// Should include active playbook but not deleted one
		expect(playbooks.some((p) => p.id === activePlaybook.id)).toBe(true)
		expect(playbooks.some((p) => p.id === deletedPlaybook.id)).toBe(false)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${activePlaybook.id}`
		await db`DELETE FROM playbooks WHERE id = ${deletedPlaybook.id}`
	})

	test('restored playbooks appear in query methods again', async () => {
		// Create and soft delete a playbook
		const playbook = await playbookRepo.create({
			team_id: null,
			name: 'Restore Test',
			created_by: testUserId,
		})

		await playbookRepo.softDelete(playbook.id)

		// Verify it's excluded
		const excludedPlaybook = await playbookRepo.findById(playbook.id)
		expect(excludedPlaybook).toBeNull()

		// Restore it
		await playbookRepo.restore(playbook.id)

		// Verify it appears in queries again
		const restoredPlaybook = await playbookRepo.findById(playbook.id)
		expect(restoredPlaybook).not.toBeNull()
		expect(restoredPlaybook?.id).toBe(playbook.id)

		const personalPlaybooks = await playbookRepo.getUserPersonalPlaybooks(testUserId)
		expect(personalPlaybooks.some((p) => p.id === playbook.id)).toBe(true)

		// Cleanup
		await db`DELETE FROM playbooks WHERE id = ${playbook.id}`
	})
})
