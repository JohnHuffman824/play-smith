import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface Play {
	id: string
	name: string
	section_id: string | null
	formation: string
	personnel?: string
	playType: string
	defensiveFormation: string
	tags: string[]
	lastModified: string
}

export interface Section {
	id: string
	name: string
	plays: Play[]
}

interface UsePlaybookDataReturn {
	sections: Section[]
	isLoading: boolean
	error: string | null
	createPlay: (name: string, sectionId: string | null) => Promise<Play>
	updatePlay: (playId: string, updates: Partial<Play>) => Promise<void>
	deletePlay: (playId: string) => Promise<void>
	duplicatePlay: (playId: string) => Promise<Play>
	createSection: (name: string) => Promise<Section>
	updateSection: (sectionId: string, updates: { name: string }) => Promise<void>
	deleteSection: (sectionId: string) => Promise<void>
	refetch: () => Promise<void>
}

export function usePlaybookData(playbookId: string | undefined): UsePlaybookDataReturn {
	const navigate = useNavigate()
	const [sections, setSections] = useState<Section[]>([])
	const [plays, setPlays] = useState<Play[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Transform API play to component format
	const transformPlay = useCallback((apiPlay: any): Play => {
		return {
			id: String(apiPlay.id),
			name: apiPlay.name || '',
			section_id: apiPlay.section_id ? String(apiPlay.section_id) : null,
			formation: apiPlay.formation_id ? String(apiPlay.formation_id) : '',
			personnel: apiPlay.personnel_id ? String(apiPlay.personnel_id) : undefined,
			playType: apiPlay.play_type || '',
			defensiveFormation: apiPlay.defensive_formation_id ? String(apiPlay.defensive_formation_id) : '',
			tags: [], // Tags not yet implemented in API
			lastModified: apiPlay.updated_at || new Date().toISOString()
		}
	}, [])

	// Helper to group plays by section
	const groupPlaysBySections = useCallback((allPlays: Play[], allSections: Array<{ id: string; name: string }>) => {
		return allSections.map(section => ({
			...section,
			plays: allPlays.filter(play => play.section_id === section.id)
		}))
	}, [])

	// Fetch data
	const fetchData = useCallback(async () => {
		if (!playbookId) return

		try {
			setIsLoading(true)
			setError(null)

			const [playsRes, sectionsRes] = await Promise.all([
				fetch(`/api/playbooks/${playbookId}/plays`),
				fetch(`/api/playbooks/${playbookId}/sections`)
			])

			if (playsRes.status === 401 || sectionsRes.status === 401) {
				navigate('/login')
				return
			}

			if (!playsRes.ok || !sectionsRes.ok) {
				throw new Error('Failed to fetch playbook data')
			}

			const playsData = await playsRes.json()
			const sectionsData = await sectionsRes.json()

			// Transform API plays to component format
			const transformedPlays = (playsData.plays || []).map(transformPlay)

			setPlays(transformedPlays)
			setSections(groupPlaysBySections(transformedPlays, sectionsData.sections || []))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsLoading(false)
		}
	}, [playbookId, navigate, groupPlaysBySections, transformPlay])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	// Create play
	const createPlay = useCallback(async (name: string, sectionId: string | null): Promise<Play> => {
		if (!playbookId) throw new Error('No playbook ID')

		const response = await fetch(`/api/playbooks/${playbookId}/plays`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, section_id: sectionId })
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to create play')
		}

		const data = await response.json()
		await fetchData() // Refetch to get updated list
		return transformPlay(data.play)
	}, [playbookId, fetchData, transformPlay])

	// Update play
	const updatePlay = useCallback(async (playId: string, updates: Partial<Play>): Promise<void> => {
		const response = await fetch(`/api/plays/${playId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates)
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to update play')
		}

		await fetchData()
	}, [fetchData])

	// Delete play
	const deletePlay = useCallback(async (playId: string): Promise<void> => {
		const response = await fetch(`/api/plays/${playId}`, {
			method: 'DELETE'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to delete play')
		}

		await fetchData()
	}, [fetchData])

	// Duplicate play
	const duplicatePlay = useCallback(async (playId: string): Promise<Play> => {
		const response = await fetch(`/api/plays/${playId}/duplicate`, {
			method: 'POST'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to duplicate play')
		}

		const data = await response.json()
		await fetchData()
		return transformPlay(data.play)
	}, [fetchData, transformPlay])

	// Create section
	const createSection = useCallback(async (name: string): Promise<Section> => {
		if (!playbookId) throw new Error('No playbook ID')

		const response = await fetch(`/api/playbooks/${playbookId}/sections`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to create section')
		}

		const data = await response.json()
		await fetchData()
		return { ...data.section, plays: [] }
	}, [playbookId, fetchData])

	// Update section
	const updateSection = useCallback(async (sectionId: string, updates: { name: string }): Promise<void> => {
		const response = await fetch(`/api/sections/${sectionId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates)
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to update section')
		}

		await fetchData()
	}, [fetchData])

	// Delete section
	const deleteSection = useCallback(async (sectionId: string): Promise<void> => {
		const response = await fetch(`/api/sections/${sectionId}`, {
			method: 'DELETE'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to delete section')
		}

		await fetchData()
	}, [fetchData])

	return {
		sections,
		isLoading,
		error,
		createPlay,
		updatePlay,
		deletePlay,
		duplicatePlay,
		createSection,
		updateSection,
		deleteSection,
		refetch: fetchData
	}
}
