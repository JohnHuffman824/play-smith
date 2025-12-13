import { useState, useEffect, useCallback } from 'react'

export interface Label {
	id: number
	name: string
	color: string
	is_preset: boolean
	team_id: number | null
}

export function useLabelsData(teamId: string | null) {
	const [labels, setLabels] = useState<Label[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchLabels = useCallback(async () => {
		if (!teamId) { setLabels([]); setIsLoading(false); return }
		try {
			setIsLoading(true)
			const res = await fetch(`/api/teams/${teamId}/labels`)
			if (!res.ok) throw new Error('Failed to fetch labels')
			const data = await res.json()
			setLabels(data.labels || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error')
		} finally {
			setIsLoading(false)
		}
	}, [teamId])

	useEffect(() => { fetchLabels() }, [fetchLabels])

	const presetLabels = labels.filter(l => l.is_preset)
	const customLabels = labels.filter(l => !l.is_preset)

	const createLabel = useCallback(async (name: string, color: string): Promise<Label> => {
		if (!teamId) throw new Error('No team')
		const res = await fetch(`/api/teams/${teamId}/labels`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, color })
		})
		if (!res.ok) throw new Error((await res.json()).error || 'Failed')
		const data = await res.json()
		await fetchLabels()
		return data.label
	}, [teamId, fetchLabels])

	const deleteLabel = useCallback(async (labelId: number) => {
		const res = await fetch(`/api/labels/${labelId}`, { method: 'DELETE' })
		if (!res.ok) throw new Error('Failed')
		await fetchLabels()
	}, [fetchLabels])

	return { labels, presetLabels, customLabels, isLoading, error, createLabel, deleteLabel, refetch: fetchLabels }
}
