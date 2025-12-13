import { db } from '../../db/connection'
import { SectionRepository } from '../../db/repositories/SectionRepository'
import type { Play } from '../../db/types'

const sectionRepo = new SectionRepository()

type PlayAction = 'create' | 'edit' | 'delete' | 'move'
type UserRole = 'owner' | 'editor' | 'viewer' | null

/**
 * Check if a user has permission to perform an action on a play
 *
 * Permission rules:
 * - Standard sections: owner/editor can do everything, viewers cannot
 * - Ideas sections: viewers can create; viewers can edit/delete only their own plays; owner/editor can do everything
 * - Moving plays between sections: only owner/editor
 */
export async function checkPlayPermission(
	userId: number,
	playId: number | null,
	sectionId: number | null,
	action: PlayAction,
	userRole: UserRole
): Promise<{ allowed: boolean; reason?: string }> {
	// No role = no access
	if (!userRole) {
		return { allowed: false, reason: 'User does not have access to this playbook' }
	}

	// Moving plays always requires owner/editor
	if (action === 'move') {
		if (userRole === 'owner' || userRole === 'editor') {
			return { allowed: true }
		}
		return { allowed: false, reason: 'Only owners and editors can move plays between sections' }
	}

	// For create action, we only need to check section permissions
	if (action === 'create') {
		if (!sectionId) {
			// Creating without a section - allow owner/editor
			if (userRole === 'owner' || userRole === 'editor') {
				return { allowed: true }
			}
			return { allowed: false, reason: 'Viewers must create plays in the Ideas section' }
		}

		const section = await sectionRepo.findById(sectionId)
		if (!section) {
			return { allowed: false, reason: 'Section not found' }
		}

		if (section.section_type === 'ideas') {
			// Anyone can create in Ideas section
			return { allowed: true }
		} else {
			// Only owner/editor can create in standard sections
			if (userRole === 'owner' || userRole === 'editor') {
				return { allowed: true }
			}
			return { allowed: false, reason: 'Only owners and editors can create plays in standard sections' }
		}
	}

	// For edit/delete, we need to check the play and its section
	if (!playId) {
		return { allowed: false, reason: 'Play ID required for this action' }
	}

	const [play] = await db<Play[]>`
		SELECT id, playbook_id, section_id, created_by
		FROM plays
		WHERE id = ${playId}
	`
	if (!play) {
		return { allowed: false, reason: 'Play not found' }
	}

	// Get the section to check its type
	if (!play.section_id) {
		// Play not in a section - only owner/editor can modify
		if (userRole === 'owner' || userRole === 'editor') {
			return { allowed: true }
		}
		return { allowed: false, reason: 'Only owners and editors can modify unsectioned plays' }
	}

	const section = await sectionRepo.findById(play.section_id)
	if (!section) {
		return { allowed: false, reason: 'Section not found' }
	}

	if (section.section_type === 'ideas') {
		// Ideas section: owner/editor can do anything, viewer can only modify their own
		if (userRole === 'owner' || userRole === 'editor') {
			return { allowed: true }
		}

		// Viewer - check if they created this play
		if (play.created_by === userId) {
			return { allowed: true }
		}

		return { allowed: false, reason: 'You can only edit or delete your own ideas' }
	} else {
		// Standard section: only owner/editor
		if (userRole === 'owner' || userRole === 'editor') {
			return { allowed: true }
		}

		return { allowed: false, reason: 'Only owners and editors can modify plays in standard sections' }
	}
}
