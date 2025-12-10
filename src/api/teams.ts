import { SessionRepository } from '../db/repositories/SessionRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'

const sessionRepo = new SessionRepository()
const teamRepo = new TeamRepository()

async function getSessionUser(req: Request) {
	const cookie = req.headers.get('Cookie')
	if (!cookie) return null

	const sessionMatch = cookie.match(/session=([^;]+)/)
	if (!sessionMatch) return null

	const session = await sessionRepo.findValidByToken(sessionMatch[1])
	if (!session) return null

	return session.user_id
}

export const teamsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		return Response.json({ teams })
	}
}
