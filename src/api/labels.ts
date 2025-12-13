import { getSessionUser } from './middleware/auth'
import { db } from '../db/connection'
import { LabelRepository } from '../db/repositories/LabelRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { checkPlaybookAccess } from './utils/checkPlaybookAccess'

const labelRepo = new LabelRepository()
const teamRepo = new TeamRepository()

export const labelsAPI = {
	listPresets: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const labels = await labelRepo.getPresetLabels()
		return Response.json({ labels })
	},

	listTeamLabels: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const teamId = parseInt(req.params.teamId)
		if (isNaN(teamId)) return Response.json({ error: 'Invalid team ID' }, { status: 400 })

		// Verify user is member of the team
		const userRole = await teamRepo.getUserRole(teamId, userId)
		if (!userRole) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const labels = await labelRepo.getTeamLabels(teamId)
		return Response.json({ labels })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const teamId = parseInt(req.params.teamId)
		if (isNaN(teamId)) return Response.json({ error: 'Invalid team ID' }, { status: 400 })

		// Verify user is member of the team
		const userRole = await teamRepo.getUserRole(teamId, userId)
		if (!userRole) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		if (!body.name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })
		if (!body.color) return Response.json({ error: 'Color required' }, { status: 400 })
		try {
			const label = await labelRepo.create({ team_id: teamId, name: body.name.trim(), color: body.color, created_by: userId })
			return Response.json({ label }, { status: 201 })
		} catch (e: any) {
			if (e.code === '23505') return Response.json({ error: 'Label exists' }, { status: 409 })
			throw e
		}
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const labelId = parseInt(req.params.labelId)
		if (isNaN(labelId)) return Response.json({ error: 'Invalid label ID' }, { status: 400 })

		// Get the label to verify team membership
		const existingLabel = await labelRepo.findById(labelId)
		if (!existingLabel) {
			return Response.json({ error: 'Not found' }, { status: 404 })
		}
		if (existingLabel.team_id) {
			const userRole = await teamRepo.getUserRole(existingLabel.team_id, userId)
			if (!userRole) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		const body = await req.json()
		const label = await labelRepo.update(labelId, body)
		if (!label) return Response.json({ error: 'Not found or preset' }, { status: 404 })
		return Response.json({ label })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const labelId = parseInt(req.params.labelId)
		if (isNaN(labelId)) return Response.json({ error: 'Invalid label ID' }, { status: 400 })

		// Get the label to verify team membership
		const existingLabel = await labelRepo.findById(labelId)
		if (!existingLabel) {
			return Response.json({ error: 'Not found' }, { status: 404 })
		}
		if (existingLabel.team_id) {
			const userRole = await teamRepo.getUserRole(existingLabel.team_id, userId)
			if (!userRole) {
				return Response.json({ error: 'Access denied' }, { status: 403 })
			}
		}

		const deleted = await labelRepo.delete(labelId)
		if (!deleted) return Response.json({ error: 'Not found or preset' }, { status: 404 })
		return new Response(null, { status: 204 })
	}
}

export const playLabelsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const playId = parseInt(req.params.playId)
		if (isNaN(playId)) return Response.json({ error: 'Invalid play ID' }, { status: 400 })

		// Get playbook for this play and check access
		const [play] = await db<{ playbook_id: number }[]>`SELECT playbook_id FROM plays WHERE id = ${playId}`
		if (!play) return Response.json({ error: 'Play not found' }, { status: 404 })

		const { hasAccess } = await checkPlaybookAccess(play.playbook_id, userId)
		if (!hasAccess) return Response.json({ error: 'Access denied' }, { status: 403 })

		const labels = await labelRepo.getPlayLabels(playId)
		return Response.json({ labels })
	},

	set: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const playId = parseInt(req.params.playId)
		if (isNaN(playId)) return Response.json({ error: 'Invalid play ID' }, { status: 400 })

		// Get playbook for this play and check access
		const [play] = await db<{ playbook_id: number }[]>`SELECT playbook_id FROM plays WHERE id = ${playId}`
		if (!play) return Response.json({ error: 'Play not found' }, { status: 404 })

		const { hasAccess } = await checkPlaybookAccess(play.playbook_id, userId)
		if (!hasAccess) return Response.json({ error: 'Access denied' }, { status: 403 })

		const body = await req.json()
		if (!Array.isArray(body.label_ids)) return Response.json({ error: 'label_ids array required' }, { status: 400 })
		await labelRepo.setPlayLabels(playId, body.label_ids)
		const labels = await labelRepo.getPlayLabels(playId)
		return Response.json({ labels })
	}
}

export const playbookLabelsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })

		// Check playbook access using existing utility
		const { hasAccess } = await checkPlaybookAccess(playbookId, userId)
		if (!hasAccess) return Response.json({ error: 'Access denied' }, { status: 403 })

		const labels = await labelRepo.getPlaybookLabels(playbookId)
		return Response.json({ labels })
	},

	set: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })

		// Check playbook access using existing utility
		const { hasAccess } = await checkPlaybookAccess(playbookId, userId)
		if (!hasAccess) return Response.json({ error: 'Access denied' }, { status: 403 })

		const body = await req.json()
		if (!Array.isArray(body.label_ids)) return Response.json({ error: 'label_ids array required' }, { status: 400 })
		await labelRepo.setPlaybookLabels(playbookId, body.label_ids)
		const labels = await labelRepo.getPlaybookLabels(playbookId)
		return Response.json({ labels })
	}
}
