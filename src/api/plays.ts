import { TeamRepository } from '../db/repositories/TeamRepository'
import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { getSessionUser } from './middleware/auth'
import { db } from '../db/connection'

const teamRepo = new TeamRepository()
const playbookRepo = new PlaybookRepository()

export const playsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		// Check playbook exists
		const playbook = await playbookRepo.findById(playbookId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check user has access to this playbook's team
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		// Get lightweight plays (no geometry or notes)
		const plays = await db`
			SELECT
				id,
				name,
				section_id,
				play_type,
				formation_id,
				personnel_id,
				defensive_formation_id,
				updated_at
			FROM plays
			WHERE playbook_id = ${playbookId}
			ORDER BY display_order ASC
		`

		return Response.json({ plays })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		// Check playbook exists
		const playbook = await playbookRepo.findById(playbookId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check user has access to this playbook's team
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const { name, section_id } = body

		// Validate required fields
		if (!name) {
			return Response.json(
				{ error: 'name is required' },
				{ status: 400 }
			)
		}

		// Get next display_order
		const [maxOrder] = await db`
			SELECT COALESCE(MAX(display_order), -1) as max_order
			FROM plays
			WHERE playbook_id = ${playbookId}
		`
		const nextOrder = (maxOrder?.max_order ?? -1) + 1

		// Create play
		const [play] = await db`
			INSERT INTO plays (playbook_id, name, section_id, created_by, display_order)
			VALUES (${playbookId}, ${name}, ${section_id ?? null}, ${userId}, ${nextOrder})
			RETURNING *
		`

		return Response.json({ play }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playId = parseInt(req.params.playId)
		if (isNaN(playId)) {
			return Response.json({ error: 'Invalid play ID' }, { status: 400 })
		}

		// Get play and check it exists
		const [play] = await db`SELECT * FROM plays WHERE id = ${playId}`
		if (!play) {
			return Response.json({ error: 'Play not found' }, { status: 404 })
		}

		// Check playbook exists
		const playbook = await playbookRepo.findById(play.playbook_id)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check user has access to this playbook's team
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const { name, section_id, play_type } = body

		// Update play
		const [updated] = await db`
			UPDATE plays
			SET
				name = COALESCE(${name ?? null}, name),
				section_id = COALESCE(${section_id ?? null}, section_id),
				play_type = COALESCE(${play_type ?? null}, play_type)
			WHERE id = ${playId}
			RETURNING *
		`

		return Response.json({ play: updated })
	},

	duplicate: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playId = parseInt(req.params.playId)
		if (isNaN(playId)) {
			return Response.json({ error: 'Invalid play ID' }, { status: 400 })
		}

		// Get play and check it exists
		const [play] = await db`SELECT * FROM plays WHERE id = ${playId}`
		if (!play) {
			return Response.json({ error: 'Play not found' }, { status: 404 })
		}

		// Check playbook exists
		const playbook = await playbookRepo.findById(play.playbook_id)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check user has access to this playbook's team
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		// Get next display_order
		const [maxOrder] = await db`
			SELECT COALESCE(MAX(display_order), -1) as max_order
			FROM plays
			WHERE playbook_id = ${play.playbook_id}
		`
		const nextOrder = (maxOrder?.max_order ?? -1) + 1

		// Create duplicate with "(Copy)" suffix
		const [newPlay] = await db`
			INSERT INTO plays (
				playbook_id,
				name,
				section_id,
				play_type,
				formation_id,
				personnel_id,
				defensive_formation_id,
				hash_position,
				notes,
				created_by,
				display_order
			)
			VALUES (
				${play.playbook_id},
				${play.name + ' (Copy)'},
				${play.section_id},
				${play.play_type},
				${play.formation_id},
				${play.personnel_id},
				${play.defensive_formation_id},
				${play.hash_position},
				${play.notes},
				${userId},
				${nextOrder}
			)
			RETURNING *
		`

		return Response.json({ play: newPlay }, { status: 201 })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playId = parseInt(req.params.playId)
		if (isNaN(playId)) {
			return Response.json({ error: 'Invalid play ID' }, { status: 400 })
		}

		// Get play and check it exists
		const [play] = await db`SELECT * FROM plays WHERE id = ${playId}`
		if (!play) {
			return Response.json({ error: 'Play not found' }, { status: 404 })
		}

		// Check playbook exists
		const playbook = await playbookRepo.findById(play.playbook_id)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}

		// Check user has access to this playbook's team
		const teams = await teamRepo.getUserTeams(userId)
		const hasAccess = teams.some(team => team.id === playbook.team_id)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		// Delete play
		await db`DELETE FROM plays WHERE id = ${playId}`

		return new Response(null, { status: 204 })
	}
}
