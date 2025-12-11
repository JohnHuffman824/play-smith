import { TeamRepository } from '../db/repositories/TeamRepository'
import { RoleTerminologyRepository } from '../db/repositories/RoleTerminologyRepository'
import { getSessionUser } from './middleware/auth'

const teamRepo = new TeamRepository()
const roleRepo = new RoleTerminologyRepository()

export const rolesAPI = {
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

		const roles = await roleRepo.getTeamRoles(teamId)
		return Response.json({ roles })
	},

	update: async (req: Request) => {
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
		const { roles } = body

		if (!roles || !Array.isArray(roles)) {
			return Response.json({ error: 'Roles array required' }, { status: 400 })
		}

		const updated = await Promise.all(
			roles.map(role =>
				roleRepo.upsert(
					teamId,
					role.standard_role,
					role.custom_name,
					role.position_type
				)
			)
		)

		return Response.json({ roles: updated })
	}
}
