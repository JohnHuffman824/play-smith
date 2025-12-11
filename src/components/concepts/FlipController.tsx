import { useEffect } from 'react'
import { usePlayContext } from '../../contexts/PlayContext'
import { flipCanvasHorizontally } from '../../utils/flip.utils'

interface FlipControllerProps {
	onFlipReady: (flipFn: () => void) => void
}

export function FlipController({ onFlipReady }: FlipControllerProps) {
	const { state, setPlayers, setDrawings } = usePlayContext()

	useEffect(() => {
		const flipCanvas = () => {
			const { players, drawings } = flipCanvasHorizontally(
				state.players,
				state.drawings
			)
			setPlayers(players)
			setDrawings(drawings)
		}
		onFlipReady(flipCanvas)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) // Only run once on mount

	return null // This component renders nothing
}
