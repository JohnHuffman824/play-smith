import type { Presentation, PresentationSlide } from '../../db/types'

export const presentationKeys = {
	all: ['presentations'] as const,
	lists: () => [...presentationKeys.all, 'list'] as const,
	list: (playbookId: number) =>
		[...presentationKeys.lists(), playbookId] as const,
	details: () => [...presentationKeys.all, 'detail'] as const,
	detail: (id: number) =>
		[...presentationKeys.details(), id] as const,
}

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

export async function fetchPresentations(playbookId: number) {
	const response = await fetch(
		`/api/playbooks/${playbookId}/presentations`
	)
	const data = await handleResponse<{
		presentations: Array<Presentation & { slide_count: number }>
	}>(response)
	return data.presentations
}

export async function fetchPresentation(presentationId: number) {
	const response = await fetch(
		`/api/presentations/${presentationId}`
	)
	return handleResponse<{
		presentation: Presentation
		slides: Array<PresentationSlide & { play_name: string | null }>
	}>(response)
}

export async function createPresentation(
	playbookId: number,
	data: { name: string; description?: string }
) {
	const response = await fetch(
		`/api/playbooks/${playbookId}/presentations`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		}
	)
	const result = await handleResponse<{ presentation: Presentation }>(
		response
	)
	return result.presentation
}

export async function updatePresentation(
	presentationId: number,
	data: { name?: string; description?: string }
) {
	const response = await fetch(
		`/api/presentations/${presentationId}`,
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		}
	)
	const result = await handleResponse<{ presentation: Presentation }>(
		response
	)
	return result.presentation
}

export async function deletePresentation(presentationId: number) {
	const response = await fetch(
		`/api/presentations/${presentationId}`,
		{ method: 'DELETE' }
	)
	if (!response.ok && response.status !== 204) {
		if (response.status === 401) {
			throw new Error('UNAUTHORIZED')
		}
		throw new Error(`Failed to delete: ${response.status}`)
	}
}

export async function addSlide(
	presentationId: number,
	playId: number
) {
	const response = await fetch(
		`/api/presentations/${presentationId}/slides`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ play_id: playId })
		}
	)
	const result = await handleResponse<{ slide: PresentationSlide }>(
		response
	)
	return result.slide
}

export async function removeSlide(
	presentationId: number,
	slideId: number
) {
	const response = await fetch(
		`/api/presentations/${presentationId}/slides/${slideId}`,
		{ method: 'DELETE' }
	)
	if (!response.ok && response.status !== 204) {
		throw new Error(`Failed to remove slide: ${response.status}`)
	}
}

export async function reorderSlides(
	presentationId: number,
	slideOrders: { id: number; display_order: number }[]
) {
	const response = await fetch(
		`/api/presentations/${presentationId}/slides`,
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ slide_orders: slideOrders })
		}
	)
	if (!response.ok) {
		throw new Error(`Failed to reorder: ${response.status}`)
	}
}
