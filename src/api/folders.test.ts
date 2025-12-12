import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { startTestServer, stopTestServer } from '../../tests/helpers/test-server'
import {
	createTestFixture,
	cleanupTestFixture,
	createTestUser,
	createTestFolder,
	type TestFixtures
} from '../../tests/helpers/factories'

describe('Folders API', () => {
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
		// Clean up test-specific folders between tests
		await db`DELETE FROM folders WHERE user_id = ${fixture.userId}`
	})

	// GET /api/folders - List folders
	test('GET /api/folders returns user folders', async () => {
		// Create test folders
		const folder1 = await createTestFolder({
			userId: fixture.userId,
			name: 'Folder A'
		})
		const folder2 = await createTestFolder({
			userId: fixture.userId,
			name: 'Folder B'
		})

		// Make request
		const response = await fetch(`${baseUrl}/api/folders`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.folders).toBeArray()
		expect(data.folders.length).toBe(2)
		// Folders should be ordered by name ASC
		expect(data.folders[0].name).toBe('Folder A')
		expect(data.folders[1].name).toBe('Folder B')
	})

	test('GET /api/folders returns empty array when user has no folders', async () => {
		const response = await fetch(`${baseUrl}/api/folders`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.folders).toBeArray()
		expect(data.folders.length).toBe(0)
	})

	test('GET /api/folders returns 401 when not authenticated', async () => {
		const response = await fetch(`${baseUrl}/api/folders`)

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Unauthorized')
	})

	test('GET /api/folders only returns folders for the authenticated user', async () => {
		// Create folder for current user
		await createTestFolder({
			userId: fixture.userId,
			name: 'My Folder'
		})

		// Create another user and their folder
		const otherUser = await createTestUser()
		await createTestFolder({
			userId: otherUser.id,
			name: 'Other User Folder'
		})

		// Make request with current user's session
		const response = await fetch(`${baseUrl}/api/folders`, {
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.folders.length).toBe(1)
		expect(data.folders[0].name).toBe('My Folder')

		// Cleanup
		await db`DELETE FROM folders WHERE user_id = ${otherUser.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	// POST /api/folders - Create folder
	test('POST /api/folders creates new folder', async () => {
		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'New Folder'
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.folder.name).toBe('New Folder')
		expect(data.folder.user_id).toBe(fixture.userId)
		expect(data.folder.id).toBeNumber()
	})

	test('POST /api/folders trims whitespace from name', async () => {
		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: '  Folder with spaces  '
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.folder.name).toBe('Folder with spaces')
	})

	test('POST /api/folders returns 400 when name is missing', async () => {
		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name is required')
	})

	test('POST /api/folders returns 400 when name is empty string', async () => {
		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: ''
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name is required')
	})

	test('POST /api/folders returns 400 when name is only whitespace', async () => {
		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: '   '
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name must be a non-empty string')
	})

	test('POST /api/folders returns 400 when name is not a string', async () => {
		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 123
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name must be a non-empty string')
	})

	test('POST /api/folders returns 400 when name exceeds 255 characters', async () => {
		const longName = 'a'.repeat(256)

		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: longName
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name must be 255 characters or less')
	})

	test('POST /api/folders accepts name with exactly 255 characters', async () => {
		const maxLengthName = 'a'.repeat(255)

		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: maxLengthName
			})
		})

		expect(response.status).toBe(201)
		const data = await response.json()
		expect(data.folder.name).toBe(maxLengthName)
	})

	test('POST /api/folders returns 401 when not authenticated', async () => {
		const response = await fetch(`${baseUrl}/api/folders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: 'Unauthorized Folder'
			})
		})

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Unauthorized')
	})

	// PUT /api/folders/:id - Update folder
	test('PUT /api/folders/:id updates folder name', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Updated Name'
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.folder.name).toBe('Updated Name')
		expect(data.folder.id).toBe(folder.id)
	})

	test('PUT /api/folders/:id trims whitespace from name', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: '  Updated Name  '
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.folder.name).toBe('Updated Name')
	})

	test('PUT /api/folders/:id returns 400 when name is missing', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name is required')
	})

	test('PUT /api/folders/:id returns 400 when name is empty string', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: ''
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name is required')
	})

	test('PUT /api/folders/:id returns 400 when name is only whitespace', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: '   '
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name must be a non-empty string')
	})

	test('PUT /api/folders/:id returns 400 when name is not a string', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 123
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name must be a non-empty string')
	})

	test('PUT /api/folders/:id returns 400 when name exceeds 255 characters', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const longName = 'a'.repeat(256)

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: longName
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('name must be 255 characters or less')
	})

	test('PUT /api/folders/:id accepts name with exactly 255 characters', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const maxLengthName = 'a'.repeat(255)

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: maxLengthName
			})
		})

		expect(response.status).toBe(200)
		const data = await response.json()
		expect(data.folder.name).toBe(maxLengthName)
	})

	test('PUT /api/folders/:id returns 400 when folder ID is invalid', async () => {
		const response = await fetch(`${baseUrl}/api/folders/invalid-id`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Updated Name'
			})
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('Invalid folder ID')
	})

	test('PUT /api/folders/:id returns 404 when folder does not exist', async () => {
		const response = await fetch(`${baseUrl}/api/folders/99999`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Updated Name'
			})
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Folder not found')
	})

	test('PUT /api/folders/:id returns 404 when folder belongs to another user', async () => {
		// Create another user and their folder
		const otherUser = await createTestUser()
		const otherFolder = await createTestFolder({
			userId: otherUser.id,
			name: 'Other User Folder'
		})

		// Try to update with current user's session
		const response = await fetch(`${baseUrl}/api/folders/${otherFolder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session_token=${fixture.sessionToken}`
			},
			body: JSON.stringify({
				name: 'Hacked Name'
			})
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Folder not found')

		// Verify folder was NOT updated
		const [unchanged] = await db`SELECT * FROM folders WHERE id = ${otherFolder.id}`
		expect(unchanged.name).toBe('Other User Folder')

		// Cleanup
		await db`DELETE FROM folders WHERE id = ${otherFolder.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('PUT /api/folders/:id returns 401 when not authenticated', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'Original Name'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: 'Updated Name'
			})
		})

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Unauthorized')
	})

	// DELETE /api/folders/:id - Delete folder
	test('DELETE /api/folders/:id deletes folder', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'To Delete'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(204)

		// Verify deleted
		const [deleted] = await db`SELECT * FROM folders WHERE id = ${folder.id}`
		expect(deleted).toBeUndefined()
	})

	test('DELETE /api/folders/:id returns 400 when folder ID is invalid', async () => {
		const response = await fetch(`${baseUrl}/api/folders/invalid-id`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(400)
		const data = await response.json()
		expect(data.error).toBe('Invalid folder ID')
	})

	test('DELETE /api/folders/:id returns 404 when folder does not exist', async () => {
		const response = await fetch(`${baseUrl}/api/folders/99999`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Folder not found')
	})

	test('DELETE /api/folders/:id returns 404 when folder belongs to another user', async () => {
		// Create another user and their folder
		const otherUser = await createTestUser()
		const otherFolder = await createTestFolder({
			userId: otherUser.id,
			name: 'Protected Folder'
		})

		// Try to delete with current user's session
		const response = await fetch(`${baseUrl}/api/folders/${otherFolder.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session_token=${fixture.sessionToken}`
			}
		})

		expect(response.status).toBe(404)
		const data = await response.json()
		expect(data.error).toBe('Folder not found')

		// Verify NOT deleted
		const [exists] = await db`SELECT * FROM folders WHERE id = ${otherFolder.id}`
		expect(exists).toBeDefined()

		// Cleanup
		await db`DELETE FROM folders WHERE id = ${otherFolder.id}`
		await db`DELETE FROM users WHERE id = ${otherUser.id}`
	})

	test('DELETE /api/folders/:id returns 401 when not authenticated', async () => {
		const folder = await createTestFolder({
			userId: fixture.userId,
			name: 'To Delete'
		})

		const response = await fetch(`${baseUrl}/api/folders/${folder.id}`, {
			method: 'DELETE'
		})

		expect(response.status).toBe(401)
		const data = await response.json()
		expect(data.error).toBe('Unauthorized')
	})
})
