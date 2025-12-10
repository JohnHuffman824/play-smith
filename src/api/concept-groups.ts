import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { ConceptGroupRepository } from '../db/repositories/ConceptGroupRepository'
import { getSessionUser } from './middleware/auth'

const teamRepo = new TeamRepository()
const playbookRepo = new PlaybookRepository()
const groupRepo = new ConceptGroupRepository()

export const conceptGroupsAPI = {
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

		const groups = await groupRepo.getTeamGroups(teamId, playbookIdNum)
		return Response.json({ groups })
	},

	get: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const groupId = parseInt(req.params.id)
		if (isNaN(groupId)) {
			return Response.json({ error: 'Invalid group ID' }, { status: 400 })
		}

		const group = await groupRepo.findById(groupId)
		if (!group) {
			return Response.json({ error: 'Group not found' }, { status: 404 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === group.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		return Response.json({ group })
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

		const groups = await groupRepo.search(teamId, query, playbookIdNum, limit)
		return Response.json({ groups })
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
		const { name, description, formation_id, playbook_id, concept_ids } = body

		if (!name) {
			return Response.json({ error: 'Name required' }, { status: 400 })
		}

		if (playbook_id) {
			const playbook = await playbookRepo.findById(playbook_id)
			if (!playbook || playbook.team_id !== teamId) {
				return Response.json({ error: 'Invalid playbook' }, { status: 400 })
			}
		}

		const group = await groupRepo.create({
			team_id: teamId,
			playbook_id: playbook_id ?? null,
			name,
			description,
			formation_id,
			created_by: userId,
			concept_ids
		})

		return Response.json({ group }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const groupId = parseInt(req.params.id)
		if (isNaN(groupId)) {
			return Response.json({ error: 'Invalid group ID' }, { status: 400 })
		}

		const group = await groupRepo.findById(groupId)
		if (!group) {
			return Response.json({ error: 'Group not found' }, { status: 404 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === group.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const { name, description, formation_id, concept_ids } = body

		const updated = await groupRepo.update(
			groupId,
			{ name, description, formation_id },
			concept_ids
		)

		return Response.json({ group: updated })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const groupId = parseInt(req.params.id)
		if (isNaN(groupId)) {
			return Response.json({ error: 'Invalid group ID' }, { status: 400 })
		}

		const group = await groupRepo.findById(groupId)
		if (!group) {
			return Response.json({ error: 'Group not found' }, { status: 404 })
		}

		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === group.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		await groupRepo.delete(groupId)
		return Response.json({ success: true })
	}
}
