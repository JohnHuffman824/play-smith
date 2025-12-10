import { PresetRouteRepository } from '../db/repositories/PresetRouteRepository'
import { getSessionUser } from './middleware/auth'

const routeRepo = new PresetRouteRepository()

export const presetRoutesAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const url = new URL(req.url)
		const teamId = url.searchParams.get('teamId')
		const teamIdNum = teamId ? parseInt(teamId) : undefined

		const routes = await routeRepo.getAll(teamIdNum)
		return Response.json({ routes })
	}
}
