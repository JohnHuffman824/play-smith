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
			console.log('[FLIP] Before flip - drawings:', stateRef.current.drawings)
			console.log('[FLIP] Before flip - drawings count:', stateRef.current.drawings.length)

			const { players, drawings } = flipCanvasHorizontally(
				stateRef.current.players,
				stateRef.current.drawings
			)

			console.log('[FLIP] After flip - drawings:', drawings)
			console.log('[FLIP] After flip - drawings count:', drawings.length)
			console.log('[FLIP] Calling setDrawings...')

			setPlayers(players)
			setDrawings(drawings)
		}
		onFlipReady(flipCanvas)
	}, [onFlipReady, setPlayers, setDrawings])

	return null
}
