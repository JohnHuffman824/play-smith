/**
 * React Query keys and functions for folders data
 *
 * This file centralizes all query keys and API functions for React Query.
 * Using query key factories ensures consistent cache keys across the app.
 */

import type { Folder } from '../../db/types'

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const folderKeys = {
	all: ['folders'] as const,
	list: () => ['folders', 'list'] as const,
	detail: (id: number) => ['folders', 'detail', id] as const,
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

export async function fetchFolders(): Promise<Folder[]> {
	const response = await fetch('/api/folders')
	const data = await handleResponse<{ folders: Folder[] }>(response)
	return data.folders
}

export async function createFolder(data: {
	name: string
}): Promise<Folder> {
	const response = await fetch('/api/folders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	const result = await handleResponse<{ folder: Folder }>(response)
	return result.folder
}

export async function updateFolder(
	id: number,
	data: { name: string }
): Promise<Folder> {
	const response = await fetch(`/api/folders/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	const result = await handleResponse<{ folder: Folder }>(response)
	return result.folder
}

export async function deleteFolder(id: number): Promise<void> {
	const response = await fetch(`/api/folders/${id}`, {
		method: 'DELETE'
	})
	if (!response.ok && response.status !== 401) {
		throw new Error(`Failed to delete folder: ${response.status}`)
	}
	if (response.status === 401) {
		throw new Error('UNAUTHORIZED')
	}
}
