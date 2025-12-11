/**
 * React Query keys and functions for teams data
 *
 * This file centralizes all query keys and API functions for React Query.
 * Using query key factories ensures consistent cache keys across the app.
 */

import type { Team, TeamMemberWithUser, TeamInvitation } from '../../db/types'

// ============================================================================
// TYPES
// ============================================================================

export type TeamWithRole = Team & { role: 'owner' | 'editor' | 'viewer' }

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const teamKeys = {
	all: ['teams'] as const,
	list: () => ['teams', 'list'] as const,
	detail: (id: number) => ['teams', 'detail', id] as const,
	members: (id: number) => ['teams', 'members', id] as const,
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('UNAUTHORIZED')
		}
		const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
		throw new Error(error.error || `HTTP ${response.status}`)
	}
	return response.json()
}

export async function fetchTeams(): Promise<TeamWithRole[]> {
	const response = await fetch('/api/teams')
	const data = await handleResponse<{ teams: TeamWithRole[] }>(response)
	return data.teams
}

export async function fetchTeamMembers(teamId: number): Promise<{
	members: TeamMemberWithUser[]
	pendingInvitations: TeamInvitation[]
}> {
	const response = await fetch(`/api/teams/${teamId}/members`)
	return handleResponse(response)
}

export async function createTeam(name: string): Promise<Team> {
	const response = await fetch('/api/teams', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name })
	})
	const data = await handleResponse<{ team: Team }>(response)
	return data.team
}

export async function updateTeam(id: number, name: string): Promise<Team> {
	const response = await fetch(`/api/teams/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name })
	})
	const data = await handleResponse<{ team: Team }>(response)
	return data.team
}

export async function deleteTeam(id: number): Promise<void> {
	const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' })
	if (!response.ok) {
		const error = await response.json().catch(() => ({}))
		throw new Error(error.error || 'Failed to delete team')
	}
}

export async function updateMemberRole(
	teamId: number,
	userId: number,
	role: 'owner' | 'editor' | 'viewer'
): Promise<void> {
	const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ role })
	})
	if (!response.ok) {
		const error = await response.json().catch(() => ({}))
		throw new Error(error.error || 'Failed to update role')
	}
}

export async function removeMember(teamId: number, userId: number): Promise<void> {
	const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
		method: 'DELETE'
	})
	if (!response.ok) {
		const error = await response.json().catch(() => ({}))
		throw new Error(error.error || 'Failed to remove member')
	}
}

export async function createInvitation(
	teamId: number,
	email: string,
	role: 'owner' | 'editor' | 'viewer'
): Promise<TeamInvitation> {
	const response = await fetch(`/api/teams/${teamId}/invitations`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, role })
	})
	const data = await handleResponse<{ invitation: TeamInvitation }>(response)
	return data.invitation
}

export async function cancelInvitation(teamId: number, invitationId: number): Promise<void> {
	const response = await fetch(`/api/teams/${teamId}/invitations/${invitationId}`, {
		method: 'DELETE'
	})
	if (!response.ok) {
		const error = await response.json().catch(() => ({}))
		throw new Error(error.error || 'Failed to cancel invitation')
	}
}
