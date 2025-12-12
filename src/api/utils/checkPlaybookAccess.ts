import { TeamRepository } from '../../db/repositories/TeamRepository'
import { PlaybookRepository } from '../../db/repositories/PlaybookRepository'

const teamRepo = new TeamRepository()
const playbookRepo = new PlaybookRepository()

/**
 * Check if a user has access to a playbook and return their role
 * - Personal playbooks (team_id is null): user must be the creator (owner role)
 * - Team playbooks: user must be a member of the team (returns team role)
 */
export async function checkPlaybookAccess(
	playbookId: number,
	userId: number
): Promise<{ hasAccess: boolean; role: 'owner' | 'editor' | 'viewer' | null; playbook: any | null }> {
	const playbook = await playbookRepo.findById(playbookId)

	if (!playbook) {
		return { hasAccess: false, role: null, playbook: null }
	}

	let hasAccess = false
	let role: 'owner' | 'editor' | 'viewer' | null = null

	if (playbook.team_id === null) {
		// Personal playbook - check if user is the creator
		hasAccess = playbook.created_by === userId
		if (hasAccess) {
			role = 'owner'
		}
	} else {
		// Team playbook - check if user is member of team and get their role
		const userRole = await teamRepo.getUserRole(userId, playbook.team_id)
		if (userRole) {
			hasAccess = true
			role = userRole
		}
	}

	return { hasAccess, role, playbook }
}

/**
 * Check if a user has access to a playbook (including deleted ones for trash operations) and return their role
 * - Personal playbooks (team_id is null): user must be the creator (owner role)
 * - Team playbooks: user must be a member of the team (returns team role)
 */
export async function checkPlaybookAccessIncludingDeleted(
	playbookId: number,
	userId: number
): Promise<{ hasAccess: boolean; role: 'owner' | 'editor' | 'viewer' | null; playbook: any | null }> {
	const playbook = await playbookRepo.findByIdIncludingDeleted(playbookId)

	if (!playbook) {
		return { hasAccess: false, role: null, playbook: null }
	}

	let hasAccess = false
	let role: 'owner' | 'editor' | 'viewer' | null = null

	if (playbook.team_id === null) {
		// Personal playbook - check if user is the creator
		hasAccess = playbook.created_by === userId
		if (hasAccess) {
			role = 'owner'
		}
	} else {
		// Team playbook - check if user is member of team and get their role
		const userRole = await teamRepo.getUserRole(userId, playbook.team_id)
		if (userRole) {
			hasAccess = true
			role = userRole
		}
	}

	return { hasAccess, role, playbook }
}
