import { useState, useEffect, useCallback } from 'react'

export interface Tag {
	id: number
	name: string
	color: string
	is_preset: boolean
	team_id: number | null
}

export function useTagsData(teamId: string | null) {
	const [tags, setTags] = useState<Tag[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchTags = useCallback(async () => {
		if (!teamId) { setTags([]); setIsLoading(false); return }
		try {
			setIsLoading(true)
			const res = await fetch(`/api/teams/${teamId}/tags`)
			if (!res.ok) throw new Error('Failed to fetch tags')
			const data = await res.json()
			setTags(data.tags || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		} finally {
			setIsLoading(false)
		}
	}, [teamId])

	useEffect(() => { fetchTags() }, [fetchTags])

	const presetTags = tags.filter(t => t.is_preset)
	const customTags = tags.filter(t => !t.is_preset)

	const createTag = useCallback(async (name: string, color: string): Promise<Tag> => {
		if (!teamId) throw new Error('No team')
		const res = await fetch(`/api/teams/${teamId}/tags`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, color })
		})
		if (!res.ok) throw new Error((await res.json()).error || 'Failed')
		const data = await res.json()
		await fetchTags()
		return data.tag
	}, [teamId, fetchTags])

	const deleteTag = useCallback(async (tagId: number) => {
		const res = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' })
		if (!res.ok) throw new Error('Failed')
		await fetchTags()
	}, [fetchTags])

	return { tags, presetTags, customTags, isLoading, error, createTag, deleteTag, refetch: fetchTags }
}
