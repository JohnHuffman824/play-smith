import { TeamRepository } from '../db/repositories/TeamRepository'
import { getSessionUser } from './middleware/auth'

const teamRepo = new TeamRepository()

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
