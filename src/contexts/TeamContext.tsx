import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface TeamContextType {
	currentTeamId: number | null
	setCurrentTeamId: (teamId: number | null) => void
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

const STORAGE_KEY = 'currentTeamId'

function getStoredTeamId(): number | null {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		return stored ? parseInt(stored, 10) : null
	} catch {
		return null
	}
}

function storeTeamId(teamId: number | null): void {
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		try {
			if (teamId === null) {
				localStorage.removeItem(STORAGE_KEY)
			} else {
				localStorage.setItem(STORAGE_KEY, String(teamId))
			}
		} catch {
			// Silently fail if localStorage is not available
		}
	}
}

export function TeamProvider({ children }: { children: ReactNode }) {
	const [currentTeamId, setCurrentTeamIdState] = useState<number | null>(() =>
		getStoredTeamId()
	)

	const setCurrentTeamId = useCallback((teamId: number | null) => {
		setCurrentTeamIdState(teamId)
		storeTeamId(teamId)
	}, [])

	return (
		<TeamContext.Provider value={{ currentTeamId, setCurrentTeamId }}>
			{children}
		</TeamContext.Provider>
	)
}

export function useTeamContext() {
	const context = useContext(TeamContext)
	if (context === undefined) {
		throw new Error('useTeamContext must be used within a TeamProvider')
	}
	return context
}
