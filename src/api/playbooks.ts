import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { getSessionUser } from './middleware/auth'
import { checkPlaybookAccess } from './utils/checkPlaybookAccess'

const teamRepo = new TeamRepository()
const playbookRepo = new PlaybookRepository()

export const playbooksAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get user's teams
		const teams = await teamRepo.getUserTeams(userId)
		const teamIds = teams.map(t => t.id)

		// Get all playbooks (team + personal) with play counts in single optimized query
		const playbooks = await playbookRepo.getUserPlaybooksWithCounts(userId, teamIds)

		return Response.json({ playbooks })
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

		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		return Response.json({ playbook })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const { team_id, name, description } = body

		// Validate required fields
		if (!name) {
			return Response.json(
				{ error: 'name is required' },
				{ status: 400 }
			)
		}

		// Check user is member of team (only if team_id is provided)
		if (team_id !== undefined && team_id !== null) {
			const teams = await teamRepo.getUserTeams(userId)
			const isMember = teams.some(team => team.id === team_id)

			if (!isMember) {
				return Response.json(
					{ error: 'Not a member of this team' },
					{ status: 403 }
				)
			}
		}

		// Create playbook
		const playbook = await playbookRepo.create({
			team_id: team_id ?? null,
			name,
			description: description || null,
			created_by: userId
		})

		return Response.json({ playbook }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const updated = await playbookRepo.update(playbookId, body)

		return Response.json({ playbook: updated })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		await playbookRepo.delete(playbookId)

		return new Response(null, { status: 204 })
	},

	toggleStar: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const updated = await playbookRepo.toggleStar(playbookId)

		return Response.json({ playbook: updated })
	}
}
