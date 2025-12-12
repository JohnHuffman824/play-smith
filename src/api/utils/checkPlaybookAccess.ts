import { TeamRepository } from '../../db/repositories/TeamRepository'
import { PlaybookRepository } from '../../db/repositories/PlaybookRepository'

const teamRepo = new TeamRepository()
const playbookRepo = new PlaybookRepository()

/**
 * Check if a user has access to a playbook
 * - Personal playbooks (team_id is null): user must be the creator
 * - Team playbooks: user must be a member of the team
 */
export async function checkPlaybookAccess(
	playbookId: number,
	userId: number
): Promise<{ hasAccess: boolean; playbook: any | null }> {
	const playbook = await playbookRepo.findById(playbookId)

	if (!playbook) {
		return { hasAccess: false, playbook: null }
	}

	let hasAccess = false

	if (playbook.team_id === null) {
		// Personal playbook - check if user is the creator
		hasAccess = playbook.created_by === userId
	} else {
		// Team playbook - check if user is member of team
		const teams = await teamRepo.getUserTeams(userId)
		hasAccess = teams.some(team => team.id === playbook.team_id)
	}

	return { hasAccess, playbook }
}

/**
 * Check if a user has access to a playbook (including deleted ones for trash operations)
 * - Personal playbooks (team_id is null): user must be the creator
 * - Team playbooks: user must be a member of the team
 */
export async function checkPlaybookAccessIncludingDeleted(
	playbookId: number,
	userId: number
): Promise<{ hasAccess: boolean; playbook: any | null }> {
	const playbook = await playbookRepo.findByIdIncludingDeleted(playbookId)

	if (!playbook) {
		return { hasAccess: false, playbook: null }
	}

	let hasAccess = false

	if (playbook.team_id === null) {
		// Personal playbook - check if user is the creator
		hasAccess = playbook.created_by === userId
	} else {
		// Team playbook - check if user is member of team
		const teams = await teamRepo.getUserTeams(userId)
		hasAccess = teams.some(team => team.id === playbook.team_id)
	}

	return { hasAccess, playbook }
}
