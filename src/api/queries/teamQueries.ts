/**
 * React Query keys and functions for teams data
 *
 * This file centralizes all query keys and API functions for React Query.
 * Using query key factories ensures consistent cache keys across the app.
 */

import type { Team } from '../../db/types'

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const teamKeys = {
	all: ['teams'] as const,
	list: () => ['teams', 'list'] as const,
	detail: (id: number) => ['teams', 'detail', id] as const,
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		if (response.status === 401) {
			throw new Error('UNAUTHORIZED')
		}
		const error = await response.text()
		throw new Error(error || `HTTP ${response.status}`)
	}
	return response.json()
}

export async function fetchTeams(): Promise<Team[]> {
	const response = await fetch('/api/teams')
	const data = await handleResponse<{ teams: Team[] }>(response)
	return data.teams
}
