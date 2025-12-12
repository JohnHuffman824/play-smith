import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react'

type CardRef = HTMLElement | null
type CardRegistry = Map<string, CardRef>

interface PlayTransitionContextValue {
	registerCard: (playId: string, element: HTMLElement | null) => void
	getCardPosition: (playId: string) => DOMRect | null
}

const PlayTransitionContext = createContext<PlayTransitionContextValue | null>(null)

export function PlayTransitionProvider({ children }: { children: ReactNode }) {
	const registryRef = useRef<CardRegistry>(new Map())

	const registerCard = useCallback((playId: string, element: HTMLElement | null) => {
		if (element) {
			registryRef.current.set(playId, element)
		} else {
			registryRef.current.delete(playId)
		}
	}, [])

	const getCardPosition = useCallback((playId: string): DOMRect | null => {
		const element = registryRef.current.get(playId)
		return element?.getBoundingClientRect() ?? null
	}, [])

	return (
		<PlayTransitionContext.Provider value={{ registerCard, getCardPosition }}>
			{children}
		</PlayTransitionContext.Provider>
	)
}

export function usePlayTransition() {
	const context = useContext(PlayTransitionContext)
	if (!context) {
		throw new Error('usePlayTransition must be used within PlayTransitionProvider')
	}
	return context
}
