import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { BaseConceptRepository } from '../db/repositories/BaseConceptRepository'
import { getSessionUser } from './middleware/auth'

const teamRepo = new TeamRepository()
const playbookRepo = new PlaybookRepository()
const conceptRepo = new BaseConceptRepository()

export const conceptsAPI = {
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

		const url = new URL(req.url)
		const playbookId = url.searchParams.get('playbookId')
		const playbookIdNum = playbookId ? parseInt(playbookId) : null
		const isMotion = url.searchParams.get('is_motion')
		const isModifier = url.searchParams.get('is_modifier')

		let concepts = await conceptRepo.getTeamConcepts(teamId, playbookIdNum)

		// Filter by flags if requested
		if (isMotion === 'true') {
			concepts = concepts.filter(c => c.is_motion)
		}
		if (isModifier === 'true') {
			concepts = concepts.filter(c => c.is_modifier)
		}

		return Response.json({ concepts })
	},

	get: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const conceptId = parseInt(req.params.id)
		if (isNaN(conceptId)) {
			return Response.json({ error: 'Invalid concept ID' }, { status: 400 })
		}

		const concept = await conceptRepo.findById(conceptId)
		if (!concept) {
			return Response.json({ error: 'Concept not found' }, { status: 404 })
		}

		if (concept.team_id) {
			const teams = await teamRepo.getUserTeams(userId)
			const hasAccess = teams.some(team => team.id === concept.team_id)

			if (!hasAccess) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		return Response.json({ concept })
	},

	search: async (req: Request) => {
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

		const url = new URL(req.url)
		const query = url.searchParams.get('q') ?? ''
		const limit = parseInt(url.searchParams.get('limit') ?? '10')
		const playbookId = url.searchParams.get('playbookId')
		const playbookIdNum = playbookId ? parseInt(playbookId) : null

		const concepts = await conceptRepo.search(teamId, query, playbookIdNum, limit)
		return Response.json({ concepts })
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
		const {
			name,
			description,
			targeting_mode,
			ball_position,
			play_direction,
			playbook_id,
			assignments,
			is_motion,
			is_modifier
		} = body

		if (!name || !targeting_mode || !assignments || !Array.isArray(assignments)) {
			return Response.json(
				{ error: 'Name, targeting_mode, and assignments required' },
				{ status: 400 }
			)
		}

		if (playbook_id) {
			const playbook = await playbookRepo.findById(playbook_id)
			if (!playbook || playbook.team_id !== teamId) {
				return Response.json({ error: 'Invalid playbook' }, { status: 400 })
			}
		}

		const concept = await conceptRepo.create({
			team_id: teamId,
			playbook_id: playbook_id ?? null,
			name,
			description,
			targeting_mode,
			ball_position,
			play_direction,
			is_motion: is_motion ?? false,
			is_modifier: is_modifier ?? false,
			created_by: userId,
			assignments
		})

		return Response.json({ concept }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const conceptId = parseInt(req.params.id)
		if (isNaN(conceptId)) {
			return Response.json({ error: 'Invalid concept ID' }, { status: 400 })
		}

		const concept = await conceptRepo.findById(conceptId)
		if (!concept) {
			return Response.json({ error: 'Concept not found' }, { status: 404 })
		}

		if (concept.team_id) {
			const teams = await teamRepo.getUserTeams(userId)
			const hasAccess = teams.some(team => team.id === concept.team_id)

			if (!hasAccess) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		const body = await req.json()
		const {
			name,
			description,
			targeting_mode,
			ball_position,
			play_direction,
			assignments,
			is_motion,
			is_modifier
		} = body

		const updated = await conceptRepo.update(
			conceptId,
			{
				name,
				description,
				targeting_mode,
				ball_position,
				play_direction,
				is_motion,
				is_modifier
			},
			assignments
		)

		return Response.json({ concept: updated })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const conceptId = parseInt(req.params.id)
		if (isNaN(conceptId)) {
			return Response.json({ error: 'Invalid concept ID' }, { status: 400 })
		}

		const concept = await conceptRepo.findById(conceptId)
		if (!concept) {
			return Response.json({ error: 'Concept not found' }, { status: 404 })
		}

		if (concept.team_id) {
			const teams = await teamRepo.getUserTeams(userId)
			const hasAccess = teams.some(team => team.id === concept.team_id)

			if (!hasAccess) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		await conceptRepo.delete(conceptId)
		return Response.json({ success: true })
	}
}
