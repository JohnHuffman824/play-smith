import { SessionRepository } from '../db/repositories/SessionRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'

const sessionRepo = new SessionRepository()
const teamRepo = new TeamRepository()
const playbookRepo = new PlaybookRepository()

async function getSessionUser(req: Request) {
	const cookie = req.headers.get('Cookie')
	if (!cookie) return null

	const sessionMatch = cookie.match(/session=([^;]+)/)
	if (!sessionMatch) return null

	const session = await sessionRepo.findValidByToken(sessionMatch[1])
	if (!session) return null

	return session.user_id
}

export const playbooksAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get user's teams
		const teams = await teamRepo.getUserTeams(userId)

		// Get playbooks for all teams
		const allPlaybooks = []
		for (const team of teams) {
			const teamPlaybooks = await playbookRepo.getTeamPlaybooks(team.id)
			allPlaybooks.push(...teamPlaybooks)
		}

		return Response.json({ playbooks: allPlaybooks })
	},

	get: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const playbook = await playbookRepo.findById(playbookId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check if user has access to this playbook's team
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		return Response.json({ playbook })
	}
}
