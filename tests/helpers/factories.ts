/**
 * Test data factories for creating users, teams, playbooks, etc.
 * These functions simplify test setup and make tests more readable.
 */

import { db } from '../../src/db/connection'
import { UserRepository } from '../../src/db/repositories/UserRepository'
import { TeamRepository } from '../../src/db/repositories/TeamRepository'
import { PlaybookRepository } from '../../src/db/repositories/PlaybookRepository'
import { SectionRepository } from '../../src/db/repositories/SectionRepository'
import { SessionRepository } from '../../src/db/repositories/SessionRepository'
import { FolderRepository } from '../../src/db/repositories/FolderRepository'

// Track created IDs for cleanup
export interface TestFixtures {
	userId: number
	teamId: number
	playbookId: number
	sessionToken: string
}

export interface CreateUserOptions {
	email?: string
	name?: string
	password_hash?: string
}

export interface CreateTeamOptions {
	name?: string
}

export interface CreatePlaybookOptions {
	teamId: number
	name?: string
	createdBy: number
}

export interface CreateSectionOptions {
	playbookId: number
	name?: string
	displayOrder?: number
}

export interface CreateFolderOptions {
	userId: number
	name?: string
}

/**
 * Creates a test user with optional custom fields
 */
export async function createTestUser(options: CreateUserOptions = {}) {
	const userRepo = new UserRepository()
	return await userRepo.create({
		email: options.email ?? `test-${Date.now()}-${Math.random()}@example.com`,
		name: options.name ?? 'Test User',
		password_hash: options.password_hash ?? 'hash'
	})
}

/**
 * Creates a test team with optional custom fields
 */
export async function createTestTeam(options: CreateTeamOptions = {}) {
	const teamRepo = new TeamRepository()
	return await teamRepo.create({
		name: options.name ?? `Test Team ${Date.now()}`
	})
}

/**
 * Adds a user to a team with specified role
 */
export async function addTeamMember(teamId: number, userId: number, role: 'owner' | 'editor' | 'viewer' = 'owner') {
	const teamRepo = new TeamRepository()
	return await teamRepo.addMember({
		team_id: teamId,
		user_id: userId,
		role
	})
}

/**
 * Creates a test playbook
 */
export async function createTestPlaybook(options: CreatePlaybookOptions) {
	const playbookRepo = new PlaybookRepository()
	return await playbookRepo.create({
		team_id: options.teamId,
		name: options.name ?? `Test Playbook ${Date.now()}`,
		created_by: options.createdBy
	})
}

/**
 * Creates a test section within a playbook
 */
export async function createTestSection(options: CreateSectionOptions) {
	const sectionRepo = new SectionRepository()
	return await sectionRepo.create(
		options.playbookId,
		options.name ?? 'Test Section',
		options.displayOrder ?? 0
	)
}

/**
 * Creates a test folder for a user
 */
export async function createTestFolder(options: CreateFolderOptions) {
	const folderRepo = new FolderRepository()
	return await folderRepo.create({
		user_id: options.userId,
		name: options.name ?? `Test Folder ${Date.now()}`
	})
}

/**
 * Creates a session for a user
 */
export async function createTestSession(userId: number) {
	const sessionRepo = new SessionRepository()
	const token = crypto.randomUUID()
	const session = await sessionRepo.create(userId, token)
	return session.token
}

/**
 * Creates a complete test fixture with user, team, playbook, and session
 * This is the most common setup for API/integration tests
 */
export async function createTestFixture(): Promise<TestFixtures> {
	// Create user
	const user = await createTestUser()

	// Create team
	const team = await createTestTeam()

	// Add user to team
	await addTeamMember(team.id, user.id, 'owner')

	// Create playbook
	const playbook = await createTestPlaybook({
		teamId: team.id,
		createdBy: user.id
	})

	// Create session
	const sessionToken = await createTestSession(user.id)

	return {
		userId: user.id,
		teamId: team.id,
		playbookId: playbook.id,
		sessionToken
	}
}

/**
 * Cleans up test fixtures (user, team, playbook, sessions)
 * Call this in afterEach or afterAll depending on your test isolation needs
 */
export async function cleanupTestFixture(fixture: TestFixtures) {
	// Clean up in reverse dependency order
	await db`DELETE FROM plays WHERE playbook_id = ${fixture.playbookId}`
	await db`DELETE FROM sections WHERE playbook_id = ${fixture.playbookId}`
	await db`DELETE FROM playbooks WHERE id = ${fixture.playbookId}`
	await db`DELETE FROM team_members WHERE team_id = ${fixture.teamId}`
	await db`DELETE FROM teams WHERE id = ${fixture.teamId}`
	await db`DELETE FROM sessions WHERE user_id = ${fixture.userId}`
	await db`DELETE FROM users WHERE id = ${fixture.userId}`
}

/**
 * Cleans up only test-specific data (plays, sections) while keeping user/team/playbook
 * Useful when sharing fixtures across tests in beforeAll/afterAll
 */
export async function cleanupTestData(playbookId: number) {
	await db`DELETE FROM plays WHERE playbook_id = ${playbookId}`
	await db`DELETE FROM sections WHERE playbook_id = ${playbookId}`
}
