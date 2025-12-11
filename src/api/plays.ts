import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { getSessionUser } from './middleware/auth'
import { db } from '../db/connection'
import { checkPlaybookAccess } from './utils/checkPlaybookAccess'

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

		const { hasAccess } = await checkPlaybookAccess(playbookId, userId)

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

		const { hasAccess } = await checkPlaybookAccess(playbookId, userId)

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
		const [play] = await db`
			SELECT id, playbook_id
			FROM plays
			WHERE id = ${playId}
		`
		if (!play) {
			return Response.json({ error: 'Play not found' }, { status: 404 })
		}

		const { hasAccess } = await checkPlaybookAccess(play.playbook_id, userId)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()

		// Build dynamic UPDATE based on provided fields
		const updates: string[] = []
		const values: any[] = []

		if (body.name !== undefined) {
			updates.push('name')
			values.push(body.name)
		}
		if (body.section_id !== undefined) {
			updates.push('section_id')
			values.push(body.section_id)
		}
		if (body.play_type !== undefined) {
			updates.push('play_type')
			values.push(body.play_type)
		}

		if (updates.length === 0) {
			return Response.json({ error: 'No fields to update' }, { status: 400 })
		}

		// Build UPDATE query dynamically
		const setClause = updates.map((col, i) => `${col} = $${i + 1}`).join(', ')
		const query = `
			UPDATE plays
			SET ${setClause}
			WHERE id = $${updates.length + 1}
			RETURNING id, playbook_id, name, section_id, play_type,
					  formation_id, personnel_id, defensive_formation_id,
					  hash_position, notes, display_order, created_by,
					  created_at, updated_at
		`

		const [updated] = await db.unsafe(query, [...values, playId])

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

		// Get play to duplicate
		const [play] = await db`
			SELECT id, playbook_id, name, section_id, play_type,
				   formation_id, personnel_id, defensive_formation_id,
				   hash_position, notes
			FROM plays
			WHERE id = ${playId}
		`
		if (!play) {
			return Response.json({ error: 'Play not found' }, { status: 404 })
		}

		const { hasAccess } = await checkPlaybookAccess(play.playbook_id, userId)

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
		const [play] = await db`
			SELECT id, playbook_id
			FROM plays
			WHERE id = ${playId}
		`
		if (!play) {
			return Response.json({ error: 'Play not found' }, { status: 404 })
		}

		const { hasAccess } = await checkPlaybookAccess(play.playbook_id, userId)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		// Delete play
		await db`DELETE FROM plays WHERE id = ${playId}`

		return new Response(null, { status: 204 })
	}
}
