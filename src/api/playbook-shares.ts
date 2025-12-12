import { PlaybookShareRepository } from '../db/repositories/PlaybookShareRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { getSessionUser } from './middleware/auth'
import { checkPlaybookAccess } from './utils/checkPlaybookAccess'

const shareRepo = new PlaybookShareRepository()
const teamRepo = new TeamRepository()

export const playbookSharesAPI = {
	/**
	 * GET /api/playbooks/:id/shares
	 * List all shares for a playbook
	 */
	listShares: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		// Check user has access to the playbook
		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		// Get shares with team names
		const shares = await shareRepo.getPlaybookSharesWithTeams(playbookId)

		return Response.json({ shares })
	},

	/**
	 * POST /api/playbooks/:id/shares
	 * Share a playbook with a team
	 * Body: { team_id: number, permission: 'view' | 'edit' }
	 */
	createShare: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		// Check user has access to the playbook
		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const { team_id, permission } = body

		// Validate required fields
		if (!team_id) {
			return Response.json({ error: 'team_id is required' }, { status: 400 })
		}

		if (permission && permission !== 'view' && permission !== 'edit') {
			return Response.json(
				{ error: 'permission must be "view" or "edit"' },
				{ status: 400 }
			)
		}

		// Verify the team exists and user is a member
		const userTeams = await teamRepo.getUserTeams(userId)
		const team = userTeams.find(t => t.id === team_id)

		if (!team) {
			return Response.json(
				{ error: 'Team not found or you are not a member' },
				{ status: 403 }
			)
		}

		// Don't allow sharing a playbook with its own team
		if (playbook.team_id === team_id) {
			return Response.json(
				{ error: 'Cannot share a playbook with its own team' },
				{ status: 400 }
			)
		}

		// Create the share
		const share = await shareRepo.share({
			playbook_id: playbookId,
			shared_with_team_id: team_id,
			permission: permission || 'view',
			shared_by: userId
		})

		return Response.json({ share }, { status: 201 })
	},

	/**
	 * DELETE /api/playbooks/:id/shares/:teamId
	 * Remove a share
	 */
	deleteShare: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.id)
		const teamId = parseInt(req.params.teamId)

		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}
		if (isNaN(teamId)) {
			return Response.json({ error: 'Invalid team ID' }, { status: 400 })
		}

		// Check user has access to the playbook
		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		// Remove the share
		await shareRepo.unshare(playbookId, teamId)

		return new Response(null, { status: 204 })
	}
}
