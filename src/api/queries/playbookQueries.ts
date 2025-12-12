/**
 * React Query keys and functions for playbooks data
 *
 * This file centralizes all query keys and API functions for React Query.
 * Using query key factories ensures consistent cache keys across the app.
 */

import type { Playbook } from '../../db/types'

// ============================================================================
// TYPES
// ============================================================================

export interface PlaybookWithCount extends Playbook {
	play_count: number
}

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const playbookKeys = {
	all: ['playbooks'] as const,
	list: () => ['playbooks', 'list'] as const,
	detail: (id: number) => ['playbooks', 'detail', id] as const,
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

export async function fetchPlaybooks(): Promise<PlaybookWithCount[]> {
	const response = await fetch('/api/playbooks')
	const data = await handleResponse<{ playbooks: PlaybookWithCount[] }>(response)
	return data.playbooks
}

export async function createPlaybook(data: {
	team_id: number | null
	name: string
	description?: string
}): Promise<Playbook> {
	const response = await fetch('/api/playbooks', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	const result = await handleResponse<{ playbook: Playbook }>(response)
	return result.playbook
}

export async function updatePlaybook(
	id: number,
	data: { name?: string; description?: string }
): Promise<Playbook> {
	const response = await fetch(`/api/playbooks/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	const result = await handleResponse<{ playbook: Playbook }>(response)
	return result.playbook
}

export async function deletePlaybook(id: number): Promise<void> {
	const response = await fetch(`/api/playbooks/${id}`, {
		method: 'DELETE'
	})
	if (!response.ok && response.status !== 401) {
		throw new Error(`Failed to delete playbook: ${response.status}`)
	}
	if (response.status === 401) {
		throw new Error('UNAUTHORIZED')
	}
}

export async function togglePlaybookStar(id: number): Promise<Playbook> {
	const response = await fetch(`/api/playbooks/${id}/star`, {
		method: 'PUT'
	})
	const result = await handleResponse<{ playbook: Playbook }>(response)
	return result.playbook
}

export async function restorePlaybook(id: number): Promise<Playbook> {
	const response = await fetch(`/api/playbooks/${id}/restore`, {
		method: 'PUT'
	})
	const result = await handleResponse<{ playbook: Playbook }>(response)
	return result.playbook
}

export async function permanentDeletePlaybook(id: number): Promise<void> {
	const response = await fetch(`/api/playbooks/${id}/permanent`, {
		method: 'DELETE'
	})
	if (!response.ok && response.status !== 401) {
		throw new Error(`Failed to permanently delete playbook: ${response.status}`)
	}
	if (response.status === 401) {
		throw new Error('UNAUTHORIZED')
	}
}

export async function emptyTrash(): Promise<number> {
	const response = await fetch('/api/trash', {
		method: 'DELETE'
	})
	const result = await handleResponse<{ deletedCount: number }>(response)
	return result.deletedCount
}
