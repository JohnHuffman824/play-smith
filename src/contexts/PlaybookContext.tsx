import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import type { Playbook } from '../db/types'
import { useTeam } from './TeamContext'
import { useAuth } from './AuthContext'

interface PlaybookContextType {
	playbooks: Playbook[]
	isLoading: boolean
	error: string | null
	fetchPlaybooks: () => Promise<void>
	createPlaybook: (name: string, teamId: number | null, description?: string) => Promise<Playbook>
	updatePlaybook: (id: number, updates: { name?: string; description?: string }) => Promise<void>
	deletePlaybook: (id: number) => Promise<void>
}

const PlaybookContext = createContext<PlaybookContextType | undefined>(undefined)

export function PlaybookProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth()
	const { currentTeamId } = useTeam()
	const [playbooks, setPlaybooks] = useState<Playbook[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchPlaybooks = useCallback(async () => {
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
	}, [])

	const createPlaybook = async (
		name: string,
		teamId: number | null,
		description?: string
	): Promise<Playbook> => {
		// Create temporary playbook with negative ID for optimistic update
		const tempId = -Date.now()
		const tempPlaybook: Playbook = {
			id: tempId,
			team_id: teamId,
			name,
			description: description || null,
			created_by: 0, // Will be set by server
			created_at: new Date(),
			updated_at: new Date()
		}

		// Optimistic update
		setPlaybooks(prev => [tempPlaybook, ...prev])
		setError(null)

		try {
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
			// Replace temp with real playbook
			setPlaybooks(prev => prev.map(pb => (pb.id === tempId ? data.playbook : pb)))
			return data.playbook
		} catch (err) {
			// Rollback on error
			setPlaybooks(prev => prev.filter(pb => pb.id !== tempId))
			const errorMsg = err instanceof Error ? err.message : 'Unknown error'
			setError(errorMsg)
			throw err
		}
	}

	const updatePlaybook = async (
		id: number,
		updates: { name?: string; description?: string }
	) => {
		// Store original for rollback
		let originalPlaybook: Playbook | undefined

		// Optimistic update
		setPlaybooks(prev =>
			prev.map(pb => {
				if (pb.id === id) {
					originalPlaybook = pb
					return { ...pb, ...updates, updated_at: new Date() }
				}
				return pb
			})
		)
		setError(null)

		try {
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
			// Replace with server version
			setPlaybooks(prev => prev.map(pb => (pb.id === id ? data.playbook : pb)))
		} catch (err) {
			// Rollback to original
			if (originalPlaybook) {
				setPlaybooks(prev => prev.map(pb => (pb.id === id ? originalPlaybook! : pb)))
			}
			const errorMsg = err instanceof Error ? err.message : 'Unknown error'
			setError(errorMsg)
			throw err
		}
	}

	const deletePlaybook = async (id: number) => {
		// Store original for rollback
		let deletedPlaybook: Playbook | undefined

		// Optimistic delete
		setPlaybooks(prev => {
			deletedPlaybook = prev.find(pb => pb.id === id)
			return prev.filter(pb => pb.id !== id)
		})
		setError(null)

		try {
			const response = await fetch(`/api/playbooks/${id}`, {
				method: 'DELETE'
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to delete playbook')
			}
		} catch (err) {
			// Rollback - restore deleted playbook
			if (deletedPlaybook) {
				setPlaybooks(prev => [deletedPlaybook!, ...prev])
			}
			const errorMsg = err instanceof Error ? err.message : 'Unknown error'
			setError(errorMsg)
			throw err
		}
	}

	useEffect(() => {
		if (user) {
			fetchPlaybooks()
		}
	}, [user, currentTeamId, fetchPlaybooks])

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
