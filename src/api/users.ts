import { UserRepository } from '../db/repositories/UserRepository'
import { getSessionUser } from './middleware/auth'
import { sanitizeUser } from './utils/sanitizeUser'

const userRepo = new UserRepository()

export const usersAPI = {
	async GET(req: Request) {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const users = await userRepo.list()
		return Response.json(users)
	},

	async POST(req: Request) {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()

		if (!body.email || !body.name) {
			return Response.json(
				{ error: 'email and name are required' },
				{ status: 400 }
			)
		}

		const user = await userRepo.create({
			email: body.email,
			name: body.name,
			password_hash: '',  // Set empty password_hash for now
		})

		// Sanitize user to remove password_hash from response
		return Response.json(sanitizeUser(user), { status: 201 })
	},
}

export async function getUserById(req: Request) {
	const userId = await getSessionUser(req)
	if (!userId) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const id = parseInt(req.params.id, 10)
	const user = await userRepo.findByIdPublic(id)

	if (!user) {
		return Response.json({ error: 'User not found' }, { status: 404 })
	}

	return Response.json(user)
}
