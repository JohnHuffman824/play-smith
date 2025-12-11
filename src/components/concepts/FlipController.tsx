import { useEffect, useRef } from 'react'
import { usePlayContext } from '../../contexts/PlayContext'
import { flipCanvasHorizontally } from '../../utils/flip.utils'

interface FlipControllerProps {
	onFlipReady: (flipFn: () => void) => void
}

export function FlipController({ onFlipReady }: FlipControllerProps) {
	const { state, setPlayers, setDrawings } = usePlayContext()
	const stateRef = useRef(state)

	// Keep ref updated with current state
	stateRef.current = state

	useEffect(() => {
		const flipCanvas = () => {
			// Access current state from ref, not stale closure
			const { players, drawings } = flipCanvasHorizontally(
				stateRef.current.players,
				stateRef.current.drawings
			)
			setPlayers(players)
			setDrawings(drawings)
		}
		onFlipReady(flipCanvas)
	}, [onFlipReady, setPlayers, setDrawings])

	return null
}
