import { FolderRepository } from '../db/repositories/FolderRepository'
import { getSessionUser } from './middleware/auth'

const folderRepo = new FolderRepository()

export const foldersAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const folders = await folderRepo.getUserFolders(userId)

		return Response.json({ folders })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const { name } = body

		// Validate required fields
		if (!name) {
			return Response.json(
				{ error: 'name is required' },
				{ status: 400 }
			)
		}

		// Validate name is not empty/whitespace
		if (typeof name !== 'string' || name.trim() === '') {
			return Response.json(
				{ error: 'name must be a non-empty string' },
				{ status: 400 }
			)
		}

		// Create folder
		const folder = await folderRepo.create({
			user_id: userId,
			name: name.trim()
		})

		return Response.json({ folder }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const folderId = parseInt(req.params.id)
		if (isNaN(folderId)) {
			return Response.json({ error: 'Invalid folder ID' }, { status: 400 })
		}

		// Check folder exists and belongs to user
		const folders = await folderRepo.getUserFolders(userId)
		const folderExists = folders.some(f => f.id === folderId)

		if (!folderExists) {
			return Response.json({ error: 'Folder not found' }, { status: 404 })
		}

		const body = await req.json()
		const { name } = body

		// Validate required fields
		if (!name) {
			return Response.json(
				{ error: 'name is required' },
				{ status: 400 }
			)
		}

		// Validate name is not empty/whitespace
		if (typeof name !== 'string' || name.trim() === '') {
			return Response.json(
				{ error: 'name must be a non-empty string' },
				{ status: 400 }
			)
		}

		const updated = await folderRepo.update(folderId, name.trim())

		return Response.json({ folder: updated })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const folderId = parseInt(req.params.id)
		if (isNaN(folderId)) {
			return Response.json({ error: 'Invalid folder ID' }, { status: 400 })
		}

		// Check folder exists and belongs to user
		const folders = await folderRepo.getUserFolders(userId)
		const folderExists = folders.some(f => f.id === folderId)

		if (!folderExists) {
			return Response.json({ error: 'Folder not found' }, { status: 404 })
		}

		await folderRepo.delete(folderId)

		return new Response(null, { status: 204 })
	}
}
