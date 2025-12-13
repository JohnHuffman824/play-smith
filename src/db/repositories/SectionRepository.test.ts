import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { SectionRepository } from './SectionRepository'
import { PlaybookRepository } from './PlaybookRepository'
import { TeamRepository } from './TeamRepository'
import { UserRepository } from './UserRepository'
import { db } from '../connection'

describe('SectionRepository', () => {
	const sectionRepo = new SectionRepository()
	const playbookRepo = new PlaybookRepository()
	const teamRepo = new TeamRepository()
	const userRepo = new UserRepository()

	let testSectionId: number
	let testSection2Id: number
	let testSection3Id: number
	let testPlaybookId: number
	let testTeamId: number
	let testUserId: number

	beforeAll(async () => {
		const user = await userRepo.create({
			email: 'section-test@example.com',
			name: 'Section Test User',
			password_hash: '$2a$10$test.hash.placeholder',
		})
		testUserId = user.id

		const team = await teamRepo.create({
			name: 'Section Test Team',
		})
		testTeamId = team.id

		const playbook = await playbookRepo.create({
			team_id: testTeamId,
			name: 'Test Playbook for Sections',
			description: 'A test playbook',
			created_by: testUserId,
		})
		testPlaybookId = playbook.id
	})

	afterAll(async () => {
		if (testSectionId) {
			await db`DELETE FROM sections WHERE id = ${testSectionId}`
		}
		if (testSection2Id) {
			await db`DELETE FROM sections WHERE id = ${testSection2Id}`
		}
		if (testSection3Id) {
			await db`DELETE FROM sections WHERE id = ${testSection3Id}`
		}
		if (testPlaybookId) {
			await db`DELETE FROM playbooks WHERE id = ${testPlaybookId}`
		}
		if (testTeamId) {
			await db`DELETE FROM teams WHERE id = ${testTeamId}`
		}
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`
		}
	})

	test('create section', async () => {
		const section = await sectionRepo.create(testPlaybookId, 'First Down', 1)

		expect(section.id).toBeGreaterThan(0)
		expect(section.name).toBe('First Down')
		expect(section.playbook_id).toBe(testPlaybookId)
		expect(section.display_order).toBe(1)
		expect(section.created_at).toBeInstanceOf(Date)
		expect(section.updated_at).toBeInstanceOf(Date)

		testSectionId = section.id
	})

	test('findById returns section', async () => {
		const section = await sectionRepo.findById(testSectionId)

		expect(section).not.toBeNull()
		expect(section?.id).toBe(testSectionId)
		expect(section?.name).toBe('First Down')
	})

	test('findById returns null for non-existent section', async () => {
		const section = await sectionRepo.findById(999999)

		expect(section).toBeNull()
	})

	test('findByPlaybookId returns all sections for a playbook', async () => {
		// Create additional sections
		const section2 = await sectionRepo.create(testPlaybookId, 'Second Down', 2)
		testSection2Id = section2.id

		const section3 = await sectionRepo.create(testPlaybookId, 'Third Down', 3)
		testSection3Id = section3.id

		const sections = await sectionRepo.findByPlaybookId(testPlaybookId)

		// Should have 4 sections: Ideas (auto-created), First Down, Second Down, Third Down
		expect(sections.length).toBe(4)
		expect(sections[0]?.name).toBe('Ideas')
		expect(sections[0]?.section_type).toBe('ideas')
		expect(sections[0]?.display_order).toBe(0)
		expect(sections[1]?.name).toBe('First Down')
		expect(sections[1]?.display_order).toBe(1)
		expect(sections[2]?.name).toBe('Second Down')
		expect(sections[2]?.display_order).toBe(2)
		expect(sections[3]?.name).toBe('Third Down')
		expect(sections[3]?.display_order).toBe(3)
	})

	test('update section name', async () => {
		const updated = await sectionRepo.update(testSectionId, {
			name: 'First Down Updated',
		})

		expect(updated.name).toBe('First Down Updated')
		expect(updated.display_order).toBe(1)
	})

	test('update section display_order', async () => {
		const updated = await sectionRepo.update(testSectionId, {
			display_order: 5,
		})

		expect(updated.name).toBe('First Down Updated')
		expect(updated.display_order).toBe(5)
	})

	test('update section name and display_order', async () => {
		const updated = await sectionRepo.update(testSectionId, {
			name: 'Goal Line',
			display_order: 1,
		})

		expect(updated.name).toBe('Goal Line')
		expect(updated.display_order).toBe(1)
	})

	test('reorder sections', async () => {
		await sectionRepo.reorder(testPlaybookId, [
			{ id: testSectionId, display_order: 3 },
			{ id: testSection2Id, display_order: 1 },
			{ id: testSection3Id, display_order: 2 },
		])

		const sections = await sectionRepo.findByPlaybookId(testPlaybookId)

		// Ideas section is not included in reorder, so it stays at display_order 0
		// So we expect: Ideas (0), Second Down (1), Third Down (2), First Down (3)
		expect(sections.length).toBe(4)
		expect(sections[0]?.name).toBe('Ideas')
		expect(sections[0]?.display_order).toBe(0)
		expect(sections[1]?.id).toBe(testSection2Id)
		expect(sections[1]?.display_order).toBe(1)
		expect(sections[2]?.id).toBe(testSection3Id)
		expect(sections[2]?.display_order).toBe(2)
		expect(sections[3]?.id).toBe(testSectionId)
		expect(sections[3]?.display_order).toBe(3)
	})

	test('delete section', async () => {
		await sectionRepo.delete(testSection3Id)

		const section = await sectionRepo.findById(testSection3Id)
		expect(section).toBeNull()

		const sections = await sectionRepo.findByPlaybookId(testPlaybookId)
		// Should have 3 sections remaining: Ideas, First Down, Second Down
		expect(sections.length).toBe(3)

		// Clear the ID so cleanup doesn't try to delete again
		testSection3Id = 0
	})
})
