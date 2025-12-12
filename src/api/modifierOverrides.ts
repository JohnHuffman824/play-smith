import { db } from '../db/connection'
import { getSessionUser } from './middleware/auth'
import { TeamRepository } from '../db/repositories/TeamRepository'

const teamRepo = new TeamRepository()

export const modifierOverridesAPI = {
	listByModifier: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const modifierId = parseInt(req.params.modifierId)
		if (isNaN(modifierId)) {
			return Response.json({ error: 'Invalid modifier ID' }, { status: 400 })
		}

		// Get the modifier concept to verify access
		const conceptResult = await db.query(
			'SELECT team_id FROM base_concepts WHERE id = $1 AND is_modifier = true',
			[modifierId]
		)

		if (conceptResult.rows.length === 0) {
			return Response.json({ error: 'Modifier not found' }, { status: 404 })
		}

		const teamId = conceptResult.rows[0].team_id
		if (teamId) {
			const teams = await teamRepo.getUserTeams(userId)
			const hasAccess = teams.some(team => team.id === teamId)

			if (!hasAccess) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		const result = await db.query(
			`SELECT mo.*, f.name as formation_name
			 FROM modifier_formation_overrides mo
			 JOIN formations f ON mo.formation_id = f.id
			 WHERE mo.modifier_concept_id = $1`,
			[modifierId]
		)

		const overrides = result.rows.map(row => ({
			...row,
			override_rules: typeof row.override_rules === 'string'
				? JSON.parse(row.override_rules)
				: row.override_rules
		}))

		return Response.json({ overrides })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const { modifier_concept_id, formation_id, override_rules } = body

		if (!modifier_concept_id || !formation_id || !override_rules) {
			return Response.json(
				{ error: 'modifier_concept_id, formation_id, and override_rules required' },
				{ status: 400 }
			)
		}

		// Verify the modifier concept exists and user has access
		const conceptResult = await db.query(
			'SELECT team_id FROM base_concepts WHERE id = $1 AND is_modifier = true',
			[modifier_concept_id]
		)

		if (conceptResult.rows.length === 0) {
			return Response.json({ error: 'Modifier concept not found' }, { status: 404 })
		}

		const teamId = conceptResult.rows[0].team_id
		if (teamId) {
			const teams = await teamRepo.getUserTeams(userId)
			const hasAccess = teams.some(team => team.id === teamId)

			if (!hasAccess) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		// Verify formation exists and belongs to same team
		const formationResult = await db.query(
			'SELECT team_id FROM formations WHERE id = $1',
			[formation_id]
		)

		if (formationResult.rows.length === 0) {
			return Response.json({ error: 'Formation not found' }, { status: 404 })
		}

		if (formationResult.rows[0].team_id !== teamId) {
			return Response.json({ error: 'Formation does not belong to same team' }, { status: 400 })
		}

		const result = await db.query(
			`INSERT INTO modifier_formation_overrides (modifier_concept_id, formation_id, override_rules)
			 VALUES ($1, $2, $3)
			 RETURNING *`,
			[modifier_concept_id, formation_id, JSON.stringify(override_rules)]
		)

		const override = {
			...result.rows[0],
			override_rules: typeof result.rows[0].override_rules === 'string'
				? JSON.parse(result.rows[0].override_rules)
				: result.rows[0].override_rules
		}

		return Response.json({ override }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const id = parseInt(req.params.id)
		if (isNaN(id)) {
			return Response.json({ error: 'Invalid override ID' }, { status: 400 })
		}

		// Verify override exists and user has access
		const overrideResult = await db.query(
			`SELECT mo.*, bc.team_id
			 FROM modifier_formation_overrides mo
			 JOIN base_concepts bc ON mo.modifier_concept_id = bc.id
			 WHERE mo.id = $1`,
			[id]
		)

		if (overrideResult.rows.length === 0) {
			return Response.json({ error: 'Override not found' }, { status: 404 })
		}

		const teamId = overrideResult.rows[0].team_id
		if (teamId) {
			const teams = await teamRepo.getUserTeams(userId)
			const hasAccess = teams.some(team => team.id === teamId)

			if (!hasAccess) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		const body = await req.json()
		const { override_rules } = body

		if (!override_rules) {
			return Response.json({ error: 'override_rules required' }, { status: 400 })
		}

		const result = await db.query(
			`UPDATE modifier_formation_overrides
			 SET override_rules = $1
			 WHERE id = $2
			 RETURNING *`,
			[JSON.stringify(override_rules), id]
		)

		const override = {
			...result.rows[0],
			override_rules: typeof result.rows[0].override_rules === 'string'
				? JSON.parse(result.rows[0].override_rules)
				: result.rows[0].override_rules
		}

		return Response.json({ override })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const id = parseInt(req.params.id)
		if (isNaN(id)) {
			return Response.json({ error: 'Invalid override ID' }, { status: 400 })
		}

		// Verify override exists and user has access
		const overrideResult = await db.query(
			`SELECT mo.*, bc.team_id
			 FROM modifier_formation_overrides mo
			 JOIN base_concepts bc ON mo.modifier_concept_id = bc.id
			 WHERE mo.id = $1`,
			[id]
		)

		if (overrideResult.rows.length === 0) {
			return Response.json({ error: 'Override not found' }, { status: 404 })
		}

		const teamId = overrideResult.rows[0].team_id
		if (teamId) {
			const teams = await teamRepo.getUserTeams(userId)
			const hasAccess = teams.some(team => team.id === teamId)

			if (!hasAccess) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		await db.query('DELETE FROM modifier_formation_overrides WHERE id = $1', [id])

		return Response.json({ success: true })
	}
}
