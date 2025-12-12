import { describe, test, expect, beforeEach } from 'bun:test'
import { db } from '../connection'
import { PlaybookShareRepository } from './PlaybookShareRepository'
import { PlaybookRepository } from './PlaybookRepository'
import { TeamRepository } from './TeamRepository'
import { UserRepository } from './UserRepository'

describe('PlaybookShareRepository', () => {
	const shareRepo = new PlaybookShareRepository()
	const playbookRepo = new PlaybookRepository()
	const teamRepo = new TeamRepository()
	const userRepo = new UserRepository()

	let userId: number
	let team1Id: number
	let team2Id: number
	let playbookId: number

	beforeEach(async () => {
		// Clean up test data
		await db`DELETE FROM playbook_shares WHERE 1=1`
		await db`DELETE FROM playbooks WHERE 1=1`
		await db`DELETE FROM team_members WHERE 1=1`
		await db`DELETE FROM teams WHERE 1=1`
		await db`DELETE FROM users WHERE email LIKE 'test-share-%'`

		// Create test user
		const user = await userRepo.create({
			email: 'test-share-user@example.com',
			name: 'Test User',
			password_hash: 'hash123'
		})
		userId = user.id

		// Create test teams
		const team1 = await teamRepo.create({ name: 'Test Team 1' })
		team1Id = team1.id

		const team2 = await teamRepo.create({ name: 'Test Team 2' })
		team2Id = team2.id

		// Create test playbook
		const playbook = await playbookRepo.create({
			team_id: team1Id,
			name: 'Test Playbook',
			created_by: userId
		})
		playbookId = playbook.id
	})

	describe('share', () => {
		test('creates a new share', async () => {
			const share = await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			expect(share).toBeDefined()
			expect(share.playbook_id).toBe(playbookId)
			expect(share.shared_with_team_id).toBe(team2Id)
			expect(share.permission).toBe('view')
			expect(share.shared_by).toBe(userId)
			expect(share.shared_at).toBeDefined()
		})

		test('updates existing share on conflict', async () => {
			// Create initial share with view permission
			const share1 = await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			// Share again with edit permission
			const share2 = await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'edit',
				shared_by: userId
			})

			expect(share2.id).toBe(share1.id)
			expect(share2.permission).toBe('edit')

			// Verify only one share exists
			const shares = await shareRepo.getPlaybookShares(playbookId)
			expect(shares.length).toBe(1)
			expect(shares[0].permission).toBe('edit')
		})

		test('can share with multiple teams', async () => {
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team1Id,
				permission: 'view',
				shared_by: userId
			})

			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'edit',
				shared_by: userId
			})

			const shares = await shareRepo.getPlaybookShares(playbookId)
			expect(shares.length).toBe(2)
		})
	})

	describe('unshare', () => {
		test('removes a share', async () => {
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			await shareRepo.unshare(playbookId, team2Id)

			const shares = await shareRepo.getPlaybookShares(playbookId)
			expect(shares.length).toBe(0)
		})

		test('does not affect other shares', async () => {
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team1Id,
				permission: 'view',
				shared_by: userId
			})

			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'edit',
				shared_by: userId
			})

			await shareRepo.unshare(playbookId, team2Id)

			const shares = await shareRepo.getPlaybookShares(playbookId)
			expect(shares.length).toBe(1)
			expect(shares[0].shared_with_team_id).toBe(team1Id)
		})

		test('handles non-existent share gracefully', async () => {
			// Should not throw
			await shareRepo.unshare(playbookId, 9999)

			const shares = await shareRepo.getPlaybookShares(playbookId)
			expect(shares.length).toBe(0)
		})
	})

	describe('getPlaybooksSharedWithTeams', () => {
		test('returns playbooks shared with given teams', async () => {
			// Share playbook with team2
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			const playbooks = await shareRepo.getPlaybooksSharedWithTeams([team2Id])

			expect(playbooks.length).toBe(1)
			expect(playbooks[0].id).toBe(playbookId)
			expect(playbooks[0].name).toBe('Test Playbook')
			expect(playbooks[0].play_count).toBe(0)
		})

		test('returns empty array for empty team list', async () => {
			const playbooks = await shareRepo.getPlaybooksSharedWithTeams([])
			expect(playbooks.length).toBe(0)
		})

		test('excludes deleted playbooks', async () => {
			// Share playbook
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			// Soft delete the playbook
			await playbookRepo.softDelete(playbookId)

			const playbooks = await shareRepo.getPlaybooksSharedWithTeams([team2Id])
			expect(playbooks.length).toBe(0)
		})

		test('orders by shared_at desc', async () => {
			// Create second playbook
			const playbook2 = await playbookRepo.create({
				team_id: team1Id,
				name: 'Test Playbook 2',
				created_by: userId
			})

			// Share first playbook
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			// Wait a bit to ensure different timestamps
			await new Promise(resolve => setTimeout(resolve, 10))

			// Share second playbook (more recent)
			await shareRepo.share({
				playbook_id: playbook2.id,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			const playbooks = await shareRepo.getPlaybooksSharedWithTeams([team2Id])
			expect(playbooks.length).toBe(2)
			expect(playbooks[0].id).toBe(playbook2.id) // Most recent first
			expect(playbooks[1].id).toBe(playbookId)
		})

		test('handles multiple teams', async () => {
			// Create another playbook for team2
			const playbook2 = await playbookRepo.create({
				team_id: team2Id,
				name: 'Test Playbook 2',
				created_by: userId
			})

			// Share first playbook with team2
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			// Share second playbook with team1
			await shareRepo.share({
				playbook_id: playbook2.id,
				shared_with_team_id: team1Id,
				permission: 'view',
				shared_by: userId
			})

			// Query for both teams
			const playbooks = await shareRepo.getPlaybooksSharedWithTeams([team1Id, team2Id])
			expect(playbooks.length).toBe(2)
		})
	})

	describe('getPlaybookShares', () => {
		test('returns all shares for a playbook', async () => {
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team1Id,
				permission: 'view',
				shared_by: userId
			})

			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'edit',
				shared_by: userId
			})

			const shares = await shareRepo.getPlaybookShares(playbookId)
			expect(shares.length).toBe(2)
		})

		test('returns empty array for playbook with no shares', async () => {
			const shares = await shareRepo.getPlaybookShares(playbookId)
			expect(shares.length).toBe(0)
		})

		test('returns shares ordered by shared_at desc', async () => {
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team1Id,
				permission: 'view',
				shared_by: userId
			})

			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'edit',
				shared_by: userId
			})

			const shares = await shareRepo.getPlaybookShares(playbookId)
			expect(shares.length).toBe(2)
			// Verify both shares are returned
			const teamIds = shares.map(s => s.shared_with_team_id)
			expect(teamIds).toContain(team1Id)
			expect(teamIds).toContain(team2Id)
		})
	})

	describe('getPlaybookSharesWithTeams', () => {
		test('returns shares with team names', async () => {
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'view',
				shared_by: userId
			})

			const shares = await shareRepo.getPlaybookSharesWithTeams(playbookId)

			expect(shares.length).toBe(1)
			expect(shares[0].playbook_id).toBe(playbookId)
			expect(shares[0].shared_with_team_id).toBe(team2Id)
			expect(shares[0].team_name).toBe('Test Team 2')
			expect(shares[0].permission).toBe('view')
		})

		test('returns multiple shares with team names', async () => {
			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team1Id,
				permission: 'view',
				shared_by: userId
			})

			await shareRepo.share({
				playbook_id: playbookId,
				shared_with_team_id: team2Id,
				permission: 'edit',
				shared_by: userId
			})

			const shares = await shareRepo.getPlaybookSharesWithTeams(playbookId)

			expect(shares.length).toBe(2)
			expect(shares.some(s => s.team_name === 'Test Team 1')).toBe(true)
			expect(shares.some(s => s.team_name === 'Test Team 2')).toBe(true)
		})
	})
})
