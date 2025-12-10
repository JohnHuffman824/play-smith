/**
 * React Query keys and functions for concept architecture data
 *
 * This file centralizes all query keys and API functions for React Query.
 * Using query key factories ensures consistent cache keys across the app.
 */

import type {
	Formation,
	BaseConcept,
	ConceptGroup,
	PresetRoute,
	RoleTerminology
} from '../../types/concept.types'

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const conceptKeys = {
	all: ['concepts'] as const,
	formations: (teamId: string) => ['concepts', 'formations', teamId] as const,
	formation: (id: number) => ['concepts', 'formation', id] as const,
	baseConcepts: (teamId: string, playbookId?: string) =>
		['concepts', 'base', teamId, playbookId] as const,
	baseConcept: (id: number) => ['concepts', 'base', id] as const,
	conceptGroups: (teamId: string, playbookId?: string) =>
		['concepts', 'groups', teamId, playbookId] as const,
	conceptGroup: (id: number) => ['concepts', 'group', id] as const,
	presetRoutes: () => ['concepts', 'preset-routes'] as const,
	roles: (teamId: string) => ['concepts', 'roles', teamId] as const
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		if (response.status === 401) {
			// Let the caller handle auth redirects
			throw new Error('UNAUTHORIZED')
		}
		const error = await response.text()
		throw new Error(error || `HTTP ${response.status}`)
	}
	return response.json()
}

// ----------------------------------------------------------------------------
// FORMATIONS
// ----------------------------------------------------------------------------

export async function fetchFormations(teamId: string): Promise<Formation[]> {
	const response = await fetch(`/api/teams/${teamId}/formations`)
	return handleResponse(response)
}

export async function createFormation(
	teamId: string,
	data: {
		name: string
		description?: string
		positions: Array<{
			role: string
			position_x: number
			position_y: number
			hash_relative?: boolean
		}>
	}
): Promise<Formation> {
	const response = await fetch(`/api/teams/${teamId}/formations`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return handleResponse(response)
}

export async function updateFormation(
	id: number,
	data: Partial<Formation>
): Promise<Formation> {
	const response = await fetch(`/api/formations/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return handleResponse(response)
}

export async function deleteFormation(id: number): Promise<void> {
	const response = await fetch(`/api/formations/${id}`, {
		method: 'DELETE'
	})
	if (!response.ok && response.status !== 401) {
		throw new Error(`Failed to delete formation: ${response.status}`)
	}
	if (response.status === 401) {
		throw new Error('UNAUTHORIZED')
	}
}

// ----------------------------------------------------------------------------
// BASE CONCEPTS
// ----------------------------------------------------------------------------

export async function fetchConcepts(
	teamId: string,
	playbookId?: string
): Promise<BaseConcept[]> {
	const url = playbookId
		? `/api/playbooks/${playbookId}/concepts`
		: `/api/teams/${teamId}/concepts`
	const response = await fetch(url)
	return handleResponse(response)
}

export async function createConcept(
	teamId: string,
	data: {
		name: string
		description?: string
		targeting_mode: 'absolute_role' | 'relative_selector'
		ball_position?: 'left' | 'center' | 'right'
		play_direction?: 'left' | 'right' | 'na'
		playbook_id?: number
		assignments: Array<any>
	}
): Promise<BaseConcept> {
	const response = await fetch(`/api/teams/${teamId}/concepts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return handleResponse(response)
}

export async function updateConcept(
	id: number,
	data: Partial<BaseConcept>
): Promise<BaseConcept> {
	const response = await fetch(`/api/concepts/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return handleResponse(response)
}

export async function deleteConcept(id: number): Promise<void> {
	const response = await fetch(`/api/concepts/${id}`, {
		method: 'DELETE'
	})
	if (!response.ok && response.status !== 401) {
		throw new Error(`Failed to delete concept: ${response.status}`)
	}
	if (response.status === 401) {
		throw new Error('UNAUTHORIZED')
	}
}

// ----------------------------------------------------------------------------
// CONCEPT GROUPS
// ----------------------------------------------------------------------------

export async function fetchConceptGroups(
	teamId: string,
	playbookId?: string
): Promise<ConceptGroup[]> {
	const url = playbookId
		? `/api/playbooks/${playbookId}/concept-groups`
		: `/api/teams/${teamId}/concept-groups`
	const response = await fetch(url)
	return handleResponse(response)
}

export async function createConceptGroup(
	teamId: string,
	data: {
		name: string
		description?: string
		formation_id?: number
		playbook_id?: number
		concept_ids?: Array<{ concept_id: number; order_index?: number }>
	}
): Promise<ConceptGroup> {
	const response = await fetch(`/api/teams/${teamId}/concept-groups`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return handleResponse(response)
}

export async function updateConceptGroup(
	id: number,
	data: Partial<ConceptGroup>
): Promise<ConceptGroup> {
	const response = await fetch(`/api/concept-groups/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return handleResponse(response)
}

export async function deleteConceptGroup(id: number): Promise<void> {
	const response = await fetch(`/api/concept-groups/${id}`, {
		method: 'DELETE'
	})
	if (!response.ok && response.status !== 401) {
		throw new Error(`Failed to delete concept group: ${response.status}`)
	}
	if (response.status === 401) {
		throw new Error('UNAUTHORIZED')
	}
}

// ----------------------------------------------------------------------------
// PRESET ROUTES & ROLES
// ----------------------------------------------------------------------------

export async function fetchPresetRoutes(): Promise<PresetRoute[]> {
	const response = await fetch('/api/preset-routes')
	return handleResponse(response)
}

export async function fetchRoles(teamId: string): Promise<RoleTerminology[]> {
	const response = await fetch(`/api/teams/${teamId}/roles`)
	return handleResponse(response)
}

export async function updateRoles(
	teamId: string,
	roles: RoleTerminology[]
): Promise<RoleTerminology[]> {
	const response = await fetch(`/api/teams/${teamId}/roles`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(roles)
	})
	return handleResponse(response)
}
