import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Playbook } from '../db/types'
import { useTeam } from './TeamContext'

interface PlaybookContextType {
	playbooks: Playbook[]
	isLoading: boolean
	error: string | null
	fetchPlaybooks: () => Promise<void>
	createPlaybook: (name: string, teamId: number, description?: string) => Promise<Playbook>
	updatePlaybook: (id: number, updates: { name?: string; description?: string }) => Promise<void>
	deletePlaybook: (id: number) => Promise<void>
}

const PlaybookContext = createContext<PlaybookContextType | undefined>(undefined)

export function PlaybookProvider({ children }: { children: ReactNode }) {
	const { currentTeamId } = useTeam()
	const [playbooks, setPlaybooks] = useState<Playbook[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPlaybooks = async () => {
		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/playbooks')

			if (!response.ok) {
				throw new Error('Failed to fetch playbooks')
			}

			const data = await response.json()
			setPlaybooks(data.playbooks)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error')
		} finally {
			setIsLoading(false)
		}
	}

	const createPlaybook = async (
		name: string,
		teamId: number,
		description?: string
	): Promise<Playbook> => {
		const response = await fetch('/api/playbooks', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ team_id: teamId, name, description })
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to create playbook')
		}

		const data = await response.json()
		setPlaybooks(prev => [data.playbook, ...prev])
		return data.playbook
	}

	const updatePlaybook = async (
		id: number,
		updates: { name?: string; description?: string }
	) => {
		const response = await fetch(`/api/playbooks/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updates)
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to update playbook')
		}

		const data = await response.json()
		setPlaybooks(playbooks.map(pb => (pb.id === id ? data.playbook : pb)))
	}

	const deletePlaybook = async (id: number) => {
		const response = await fetch(`/api/playbooks/${id}`, {
			method: 'DELETE'
		})

		if (!response.ok) {
			const data = await response.json()
			throw new Error(data.error || 'Failed to delete playbook')
		}

		setPlaybooks(playbooks.filter(pb => pb.id !== id))
	}

	useEffect(() => {
		if (currentTeamId) {
			fetchPlaybooks()
		}
	}, [currentTeamId])

	return (
		<PlaybookContext.Provider
			value={{
				playbooks,
				isLoading,
				error,
				fetchPlaybooks,
				createPlaybook,
				updatePlaybook,
				deletePlaybook
			}}
		>
			{children}
		</PlaybookContext.Provider>
	)
}

export function usePlaybook() {
	const context = useContext(PlaybookContext)
	if (context === undefined) {
		throw new Error('usePlaybook must be used within a PlaybookProvider')
	}
	return context
}
