import { getSessionUser } from './middleware/auth'
import { db } from '../db/connection'
import { checkPlaybookAccess } from './utils/checkPlaybookAccess'

type FormationPosition = {
	id: number
	role: string
	position_x: string | number
	position_y: string | number
}

type ConceptApplication = {
	concept_id: number | null
	concept_group_id: number | null
	order_index: number
}

type GroupConcept = {
	concept_id: number
}

type ConceptAssignment = {
	id: number
	concept_id: number
	role: string | null
	drawing_data: Record<string, unknown> | null
	order_index: number
}

type PlayerData = {
	id: string
	x: number
	y: number
	label: string
	color: string
}

export const playsAPI = {
	/**
	 * Get full play data including players and drawings for animation.
	 */
	get: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playId = parseInt(req.params.playId)
		if (isNaN(playId)) {
			return Response.json({ error: 'Invalid play ID' }, { status: 400 })
		}

		const [play] = await db`
			SELECT p.*, pb.team_id
			FROM plays p
			JOIN playbooks pb ON p.playbook_id = pb.id
			WHERE p.id = ${playId}
		`
		if (!play) {
			return Response.json({ error: 'Play not found' }, { status: 404 })
		}

		const { hasAccess } = await checkPlaybookAccess(play.playbook_id, userId)
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		let players: PlayerData[] = []

		if (play.formation_id) {
			const positions: FormationPosition[] = await db`
				SELECT id, role, position_x, position_y
				FROM formation_player_positions
				WHERE formation_id = ${play.formation_id}
			`
			players = positions.map((pos) => ({
				id: `player-${pos.role}-${pos.id}`,
				x: Number(pos.position_x),
				y: Number(pos.position_y),
				label: pos.role,
				color: '#000000',
			}))
		}

		// Add custom players (not derived from formations)
		const customPlayers = (typeof play.custom_players === 'string'
			? JSON.parse(play.custom_players)
			: play.custom_players || []) as PlayerData[]
		players = [...players, ...customPlayers]

		const conceptApplications: ConceptApplication[] = await db`
			SELECT ca.concept_id, ca.concept_group_id, ca.order_index
			FROM concept_applications ca
			WHERE ca.play_id = ${playId}
			ORDER BY ca.order_index
		`

		const directConceptIds = conceptApplications
			.filter((ca) => ca.concept_id !== null)
			.map((ca) => ca.concept_id as number)

		const conceptGroupIds = conceptApplications
			.filter((ca) => ca.concept_group_id !== null)
			.map((ca) => ca.concept_group_id as number)

		let groupConceptIds: number[] = []
		if (conceptGroupIds.length > 0) {
			const groupConcepts: GroupConcept[] = await db`
				SELECT concept_id
				FROM concept_group_concepts
				WHERE concept_group_id = ANY(${conceptGroupIds})
			`
			groupConceptIds = groupConcepts.map((gc) => gc.concept_id)
		}

		const allConceptIds = [...directConceptIds, ...groupConceptIds]

		let drawings: Record<string, unknown>[] = []
		if (allConceptIds.length > 0) {
			const assignments: ConceptAssignment[] = await db`
				SELECT id, concept_id, role, drawing_data, order_index
				FROM concept_player_assignments
				WHERE concept_id = ANY(${allConceptIds})
				ORDER BY order_index
			`

			drawings = assignments
				.filter((a) => a.drawing_data !== null)
				.map((a) => {
					const drawingData = a.drawing_data as Record<string, unknown>
					const linkedPlayer = players.find((p) => p.label === a.role)
					return {
						...drawingData,
						id: drawingData.id ?? `drawing-${a.id}`,
						playerId: linkedPlayer?.id ?? null,
					}
				})
		}

		// Add custom drawings (not derived from concepts)
		const customDrawings = (typeof play.custom_drawings === 'string'
			? JSON.parse(play.custom_drawings)
			: play.custom_drawings || []) as Record<string, unknown>[]
		drawings = [...drawings, ...customDrawings]

		return Response.json({
			play: {
				id: String(play.id),
				name: play.name || 'Untitled Play',
				teamId: play.team_id ? String(play.team_id) : null,
				players,
				drawings,
			},
		})
	},

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

		// Get plays with drawing data from applied concepts
		const plays = await db`
			SELECT
				p.id,
				p.name,
				p.section_id,
				p.play_type,
				p.formation_id,
				p.personnel_id,
				p.defensive_formation_id,
				p.updated_at,
				(
					SELECT json_agg(cpa.drawing_data)
					FROM concept_applications ca
					JOIN concept_player_assignments cpa ON cpa.concept_id = ca.concept_id
					WHERE ca.play_id = p.id AND cpa.drawing_data IS NOT NULL
				) as drawings
			FROM plays p
			WHERE p.playbook_id = ${playbookId}
			ORDER BY p.display_order ASC
		`

		return Response.json({ plays })
	},

	create: async (req: Request) => {
		try {
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

			// Handle special "__unsectioned__" value - convert to null for database
			const sectionIdValue = section_id === '__unsectioned__' ? null : (section_id ?? null)

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
				VALUES (${playbookId}, ${name}, ${sectionIdValue}, ${userId}, ${nextOrder})
				RETURNING *
			`

			return Response.json({ play }, { status: 201 })
		} catch (error) {
			console.error('Play creation error:', error)
			return Response.json(
				{ error: 'Failed to create play' },
				{ status: 500 }
			)
		}
	},

	update: async (req: Request) => {
		try {
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
			if (body.custom_players !== undefined) {
				updates.push('custom_players')
				values.push(JSON.stringify(body.custom_players))
			}
			if (body.custom_drawings !== undefined) {
				updates.push('custom_drawings')
				values.push(JSON.stringify(body.custom_drawings))
			}
			if (body.hash_position !== undefined) {
				updates.push('hash_position')
				values.push(body.hash_position)
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
						  created_at, updated_at, custom_players, custom_drawings
			`

			const [updated] = await db.unsafe(query, [...values, playId])

			return Response.json({ play: updated })
		} catch (error) {
			console.error('Play update error:', error)
			return Response.json(
				{ error: 'Failed to update play' },
				{ status: 500 }
			)
		}
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
