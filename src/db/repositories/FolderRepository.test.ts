import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { FolderRepository } from './FolderRepository'
import { UserRepository } from './UserRepository'
import { db } from '../connection'

describe('FolderRepository', () => {
	const folderRepo = new FolderRepository()
	const userRepo = new UserRepository()

	let testUserId: number
	let testFolderId: number
	const testEmail = `folder-test-${Date.now()}@example.com`

	beforeAll(async () => {
		// Create a test user
		const user = await userRepo.create({
			email: testEmail,
			name: 'Folder Test User',
			password_hash: '$2a$10$test.hash.placeholder',
		})
		testUserId = user.id
	})

	afterAll(async () => {
		// Cleanup in correct order to avoid foreign key constraints
		if (testUserId) {
			await db`DELETE FROM folders WHERE user_id = ${testUserId}`
		}
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`
		}
	})

	test('create folder', async () => {
		const folder = await folderRepo.create({
			user_id: testUserId,
			name: 'Test Folder',
		})

		expect(folder.id).toBeGreaterThan(0)
		expect(folder.name).toBe('Test Folder')
		expect(folder.user_id).toBe(testUserId)
		expect(folder.created_at).toBeInstanceOf(Date)

		testFolderId = folder.id
	})

	test('getUserFolders returns folders ordered by name', async () => {
		// Create additional folders with specific names to test ordering
		const folderB = await folderRepo.create({
			user_id: testUserId,
			name: 'B Folder',
		})

		const folderA = await folderRepo.create({
			user_id: testUserId,
			name: 'A Folder',
		})

		const folderC = await folderRepo.create({
			user_id: testUserId,
			name: 'C Folder',
		})

		const folders = await folderRepo.getUserFolders(testUserId)

		expect(folders.length).toBeGreaterThanOrEqual(4) // At least our 4 test folders

		// Verify they are ordered by name (ASC)
		const ourFolders = folders.filter(f =>
			[folderA.id, folderB.id, folderC.id, testFolderId].includes(f.id)
		)

		expect(ourFolders[0].name).toBe('A Folder')
		expect(ourFolders[1].name).toBe('B Folder')
		expect(ourFolders[2].name).toBe('C Folder')
		expect(ourFolders[3].name).toBe('Test Folder')
	})

	test('getUserFolders returns empty array for user with no folders', async () => {
		// Create a new user with no folders
		const newUser = await userRepo.create({
			email: `no-folders-${Date.now()}@example.com`,
			name: 'No Folders User',
			password_hash: '$2a$10$test.hash.placeholder',
		})

		const folders = await folderRepo.getUserFolders(newUser.id)

		expect(folders).toBeInstanceOf(Array)
		expect(folders.length).toBe(0)

		// Cleanup
		await db`DELETE FROM users WHERE id = ${newUser.id}`
	})

	test('getUserFolders only returns folders for specified user', async () => {
		// Create another user with their own folder
		const otherUser = await userRepo.create({
			email: `other-user-${Date.now()}@example.com`,
			name: 'Other User',
			password_hash: '$2a$10$test.hash.placeholder',
		})

		const otherFolder = await folderRepo.create({
			user_id: otherUser.id,
			name: 'Other User Folder',
		})

		// Get folders for testUserId
		const folders = await folderRepo.getUserFolders(testUserId)

		// Should not contain other user's folder
		expect(folders.every(f => f.user_id === testUserId)).toBe(true)
		expect(folders.some(f => f.id === otherFolder.id)).toBe(false)

		// Cleanup
		await db`DELETE FROM folders WHERE id = ${otherFolder.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('update folder name', async () => {
		const updated = await folderRepo.update(testFolderId, 'Updated Folder Name')

		expect(updated).not.toBeNull()
		expect(updated?.id).toBe(testFolderId)
		expect(updated?.name).toBe('Updated Folder Name')
		expect(updated?.user_id).toBe(testUserId)
	})

	test('update non-existent folder returns null', async () => {
		const updated = await folderRepo.update(999999, 'Should Not Update')

		expect(updated).toBeNull()
	})

	test('update folder with empty name', async () => {
		const updated = await folderRepo.update(testFolderId, '')

		expect(updated).not.toBeNull()
		expect(updated?.name).toBe('')
	})

	test('update folder with special characters in name', async () => {
		const specialName = 'Test & "Special" <Characters> 123!'
		const updated = await folderRepo.update(testFolderId, specialName)

		expect(updated).not.toBeNull()
		expect(updated?.name).toBe(specialName)

		// Verify it persists
		const folders = await folderRepo.getUserFolders(testUserId)
		const folder = folders.find(f => f.id === testFolderId)
		expect(folder?.name).toBe(specialName)
	})

	test('delete folder', async () => {
		// Create a folder to delete
		const folderToDelete = await folderRepo.create({
			user_id: testUserId,
			name: 'Delete Me',
		})

		// Delete it
		await folderRepo.delete(folderToDelete.id)

		// Verify it's gone
		const folders = await folderRepo.getUserFolders(testUserId)
		expect(folders.some(f => f.id === folderToDelete.id)).toBe(false)
	})

	test('delete non-existent folder does not throw error', async () => {
		// Should not throw an error
		await expect(folderRepo.delete(999999)).resolves.toBeUndefined()
	})

	test('create multiple folders with same name for same user', async () => {
		// Should allow duplicate names (no unique constraint on name per user)
		const folder1 = await folderRepo.create({
			user_id: testUserId,
			name: 'Duplicate Name',
		})

		const folder2 = await folderRepo.create({
			user_id: testUserId,
			name: 'Duplicate Name',
		})

		expect(folder1.id).not.toBe(folder2.id)
		expect(folder1.name).toBe(folder2.name)
		expect(folder1.user_id).toBe(folder2.user_id)

		const folders = await folderRepo.getUserFolders(testUserId)
		const duplicates = folders.filter(f => f.name === 'Duplicate Name')
		expect(duplicates.length).toBeGreaterThanOrEqual(2)
	})

	test('create folder with long name', async () => {
		const longName = 'A'.repeat(255) // Test with a very long name
		const folder = await folderRepo.create({
			user_id: testUserId,
			name: longName,
		})

		expect(folder.name).toBe(longName)
		expect(folder.name.length).toBe(255)
	})

	test('folders maintain separate created_at timestamps', async () => {
		const folder1 = await folderRepo.create({
			user_id: testUserId,
			name: 'Timestamp Test 1',
		})

		// Add delay to ensure different timestamps (SQLite has 1 second resolution)
		await new Promise((resolve) => setTimeout(resolve, 1100))

		const folder2 = await folderRepo.create({
			user_id: testUserId,
			name: 'Timestamp Test 2',
		})

		expect(folder1.created_at).toBeInstanceOf(Date)
		expect(folder2.created_at).toBeInstanceOf(Date)
		expect(folder2.created_at.getTime()).toBeGreaterThanOrEqual(folder1.created_at.getTime())
	})
})
