import { TeamRepository } from '../db/repositories/TeamRepository'
import { FormationRepository } from '../db/repositories/FormationRepository'
import { getSessionUser } from './middleware/auth'

const teamRepo = new TeamRepository()
const formationRepo = new FormationRepository()

export const formationsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.teamId)
		if (isNaN(teamId)) {
			return Response.json({ error: 'Invalid team ID' }, { status: 400 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === teamId)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const formations = await formationRepo.getTeamFormations(teamId)
		return Response.json({ formations })
	},

	get: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const formationId = parseInt(req.params.id)
		if (isNaN(formationId)) {
			return Response.json({ error: 'Invalid formation ID' }, { status: 400 })
		}

		const formation = await formationRepo.findById(formationId)
		if (!formation) {
			return Response.json({ error: 'Formation not found' }, { status: 404 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === formation.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		return Response.json({ formation })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.teamId)
		if (isNaN(teamId)) {
			return Response.json({ error: 'Invalid team ID' }, { status: 400 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === teamId)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const { name, description, positions } = body

		if (!name || !positions || !Array.isArray(positions)) {
			return Response.json(
				{ error: 'Name and positions array required' },
				{ status: 400 }
			)
		}

		const formation = await formationRepo.create({
			team_id: teamId,
			name,
			description,
			created_by: userId,
			positions
		})

		return Response.json({ formation }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const formationId = parseInt(req.params.id)
		if (isNaN(formationId)) {
			return Response.json({ error: 'Invalid formation ID' }, { status: 400 })
		}

		const formation = await formationRepo.findById(formationId)
		if (!formation) {
			return Response.json({ error: 'Formation not found' }, { status: 404 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === formation.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const { name, description, positions } = body

		const updated = await formationRepo.update(
			formationId,
			{ name, description },
			positions
		)

		return Response.json({ formation: updated })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const formationId = parseInt(req.params.id)
		if (isNaN(formationId)) {
			return Response.json({ error: 'Invalid formation ID' }, { status: 400 })
		}

		const formation = await formationRepo.findById(formationId)
		if (!formation) {
			return Response.json({ error: 'Formation not found' }, { status: 404 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === formation.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		await formationRepo.delete(formationId)
		return Response.json({ success: true })
	}
}
