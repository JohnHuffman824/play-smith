import { TeamRepository } from '../db/repositories/TeamRepository'
import { InvitationRepository } from '../db/repositories/InvitationRepository'
import { UserRepository } from '../db/repositories/UserRepository'
import { getSessionUser } from './middleware/auth'
import { AuthService } from '../services/AuthService'

const teamRepo = new TeamRepository()
const invitationRepo = new InvitationRepository()
const userRepo = new UserRepository()
const authService = new AuthService()

export const teamsAPI = {
	// GET /api/teams - List user's teams with roles
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teams = await teamRepo.getUserTeamsWithRole(userId)
		return Response.json({ teams })
	},

	// GET /api/teams/:id - Get single team details
	get: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.id)
		const role = await teamRepo.getUserRole(teamId, userId)

		if (!role) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const team = await teamRepo.findById(teamId)
		return Response.json({ team, role })
	},

	// POST /api/teams - Create new team
	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { name } = await req.json()
		if (!name?.trim()) {
			return Response.json({ error: 'Team name is required' }, { status: 400 })
		}

		const team = await teamRepo.create({ name: name.trim() })
		await teamRepo.addMember({ team_id: team.id, user_id: userId, role: 'owner' })

		return Response.json({ team }, { status: 201 })
	},

	// PATCH /api/teams/:id - Update team
	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.id)
		const isOwner = await teamRepo.isOwner(teamId, userId)

		if (!isOwner) {
			return Response.json({ error: 'Only owners can edit teams' }, { status: 403 })
		}

		const { name } = await req.json()
		if (!name?.trim()) {
			return Response.json({ error: 'Team name is required' }, { status: 400 })
		}

		const team = await teamRepo.update(teamId, { name: name.trim() })
		return Response.json({ team })
	},

	// DELETE /api/teams/:id - Delete team
	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.id)
		const isOwner = await teamRepo.isOwner(teamId, userId)

		if (!isOwner) {
			return Response.json({ error: 'Only owners can delete teams' }, { status: 403 })
		}

		await teamRepo.delete(teamId)
		return new Response(null, { status: 204 })
	},

	// GET /api/teams/:id/members - List team members
	getMembers: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.id)
		const role = await teamRepo.getUserRole(teamId, userId)

		if (!role) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const members = await teamRepo.getMembersWithUsers(teamId)
		const pendingInvitations = role === 'owner'
			? await invitationRepo.findPendingByTeam(teamId)
			: []

		return Response.json({ members, pendingInvitations })
	},

	// PATCH /api/teams/:id/members/:userId - Update member role
	updateMemberRole: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.id)
		const memberId = parseInt(req.params.userId)

		const isOwner = await teamRepo.isOwner(teamId, userId)
		if (!isOwner) {
			return Response.json({ error: 'Only owners can change roles' }, { status: 403 })
		}

		const { role } = await req.json()
		if (!['owner', 'editor', 'viewer'].includes(role)) {
			return Response.json({ error: 'Invalid role' }, { status: 400 })
		}

		await teamRepo.updateMemberRole(teamId, memberId, role)
		return Response.json({ success: true })
	},

	// DELETE /api/teams/:id/members/:userId - Remove member
	removeMember: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.id)
		const memberId = parseInt(req.params.userId)

		const isOwner = await teamRepo.isOwner(teamId, userId)
		const isSelf = userId === memberId

		if (!isOwner && !isSelf) {
			return Response.json({ error: 'Permission denied' }, { status: 403 })
		}

		// Prevent removing last owner
		if (isOwner && isSelf) {
			const members = await teamRepo.getMembersWithUsers(teamId)
			const owners = members.filter(m => m.role === 'owner')
			if (owners.length === 1) {
				return Response.json({ error: 'Cannot remove last owner' }, { status: 400 })
			}
		}

		await teamRepo.removeMember(teamId, memberId)
		return new Response(null, { status: 204 })
	},

	// POST /api/teams/:id/invitations - Create invitation
	createInvitation: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.id)
		const isOwner = await teamRepo.isOwner(teamId, userId)

		if (!isOwner) {
			return Response.json({ error: 'Only owners can invite members' }, { status: 403 })
		}

		const { email, role } = await req.json()
		if (!email?.trim()) {
			return Response.json({ error: 'Email is required' }, { status: 400 })
		}
		if (!['owner', 'editor', 'viewer'].includes(role)) {
			return Response.json({ error: 'Invalid role' }, { status: 400 })
		}

		// Check if user already a member
		const existingUser = await userRepo.findByEmail(email)
		if (existingUser) {
			const existingRole = await teamRepo.getUserRole(teamId, existingUser.id)
			if (existingRole) {
				return Response.json({ error: 'User is already a team member' }, { status: 409 })
			}
		}

		const token = authService.generateSessionToken()
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

		const invitation = await invitationRepo.create({
			team_id: teamId,
			email: email.trim().toLowerCase(),
			role,
			token,
			invited_by: userId,
			expires_at: expiresAt
		})

		// TODO: Send email with invitation link
		// For now, return the token for testing
		return Response.json({ invitation }, { status: 201 })
	},

	// DELETE /api/teams/:id/invitations/:invitationId - Cancel invitation
	deleteInvitation: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const teamId = parseInt(req.params.id)
		const invitationId = parseInt(req.params.invitationId)

		const isOwner = await teamRepo.isOwner(teamId, userId)
		if (!isOwner) {
			return Response.json({ error: 'Only owners can cancel invitations' }, { status: 403 })
		}

		await invitationRepo.delete(invitationId)
		return new Response(null, { status: 204 })
	},

	// POST /api/invitations/accept - Accept invitation (public with token)
	acceptInvitation: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { token } = await req.json()
		const invitation = await invitationRepo.findByToken(token)

		if (!invitation) {
			return Response.json({ error: 'Invalid or expired invitation' }, { status: 404 })
		}

		// Verify email matches
		const user = await userRepo.findById(userId)
		if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
			return Response.json({ error: 'Invitation is for a different email' }, { status: 403 })
		}

		await teamRepo.addMember({
			team_id: invitation.team_id,
			user_id: userId,
			role: invitation.role
		})
		await invitationRepo.markAccepted(invitation.id)

		const team = await teamRepo.findById(invitation.team_id)
		return Response.json({ team })
	}
}
