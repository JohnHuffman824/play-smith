import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing } from '../../types/drawing.types'
import { findSnapTarget, findPlayerSnapTarget } from '../../utils/drawing.utils'
import type { SnapTarget, PlayerSnapTarget } from '../../utils/drawing.utils'
import { PLAYER_RADIUS_FEET } from '../../constants/field.constants'

interface ControlPointOverlayProps {
	drawing: Drawing | null
	drawings: Drawing[]
	players?: Array<{ id: string; x: number; y: number; label: string; color: string }>
	coordSystem: FieldCoordinateSystem
	snapThreshold: number
	isGlobalSelect?: boolean
	onDragPoint?: (
		drawingId: string,
		pointId: string,
		x: number,
		y: number,
	) => void
	onMerge?: (
		sourceDrawingId: string,
		sourcePointId: string,
		targetDrawingId: string,
		targetPointId: string,
	) => void
	onLinkToPlayer?: (
		drawingId: string,
		pointId: string,
		playerId: string,
	) => void
}

interface DragState {
	pointId: string
	snapTarget?: SnapTarget | null
}

/**
* Renders draggable control points and snap indicators.
*/
export function ControlPointOverlay({
	drawing,
	drawings,
	players,
	coordSystem,
	snapThreshold,
	isGlobalSelect = false,
	onDragPoint,
	onMerge,
	onLinkToPlayer,
}: ControlPointOverlayProps) {
	if (!drawing) return null
	const [dragState, setDragState] = useState<DragState | null>(null)
	const [snapTarget, setSnapTarget] = useState<SnapTarget | null>(null)
	const [playerSnapTarget, setPlayerSnapTarget] = useState<PlayerSnapTarget | null>(null)
	const overlayRef = useRef<SVGGElement | null>(null)

	// Use refs to avoid stale closure issues in handlePointerUp
	const snapTargetRef = useRef<SnapTarget | null>(null)
	const playerSnapTargetRef = useRef<PlayerSnapTarget | null>(null)
	const dragStateRef = useRef<DragState | null>(null)

	const handlePointerUp = useCallback(function handlePointerUp() {
		// Use refs to get current values instead of closure values
		const currentDragState = dragStateRef.current
		const currentSnapTarget = snapTargetRef.current
		const currentPlayerSnapTarget = playerSnapTargetRef.current

		if (!currentDragState) {
			return
		}

		if (currentPlayerSnapTarget && currentDragState && onLinkToPlayer) {
			onLinkToPlayer(
				drawing.id,
				currentDragState.pointId,
				currentPlayerSnapTarget.playerId,
			)
		} else if (currentSnapTarget && currentDragState && onMerge) {
			onMerge(
				drawing.id,
				currentDragState.pointId,
				currentSnapTarget.drawingId,
				currentSnapTarget.pointId,
			)
		}

		setDragState(null)
		setSnapTarget(null)
		setPlayerSnapTarget(null)
		dragStateRef.current = null
		snapTargetRef.current = null
		playerSnapTargetRef.current = null
	}, [onLinkToPlayer, onMerge, drawing.id])

	useEffect(() => {
		window.addEventListener('pointerup', handlePointerUp)
		return () => window.removeEventListener('pointerup', handlePointerUp)
	}, [handlePointerUp])

	const handlePointerMove = useCallback(
		function handlePointerMove(event: PointerEvent) {
			if (!dragState || !onDragPoint) return
			const svg = overlayRef.current?.ownerSVGElement
			if (!svg) return

			const rect = svg.getBoundingClientRect()
			const pixelX = event.clientX - rect.left
			const pixelY = event.clientY - rect.top
			const feet = coordSystem.pixelsToFeet(pixelX, pixelY)

			onDragPoint(drawing.id, dragState.pointId, feet.x, feet.y)

			const playerRadiusFeet = PLAYER_RADIUS_FEET

			if (players && players.length > 0) {
				const playerTarget = findPlayerSnapTarget(
					feet,
					players,
					playerRadiusFeet,
				)
				if (playerTarget) {
					setPlayerSnapTarget(playerTarget)
					playerSnapTargetRef.current = playerTarget
					setSnapTarget(null)
					snapTargetRef.current = null
					return
				}
			}

			setPlayerSnapTarget(null)
			playerSnapTargetRef.current = null
			const thresholdFeet = snapThreshold / coordSystem.scale
			const target = findSnapTarget(
				feet,
				drawings,
				drawing.id,
				thresholdFeet,
			)
			setSnapTarget(target)
			snapTargetRef.current = target
		},
		[
			dragState,
			onDragPoint,
			drawing.id,
			coordSystem,
			drawings,
			players,
			snapThreshold,
		],
	)

	useEffect(() => {
		if (!dragState) return
		window.addEventListener('pointermove', handlePointerMove)
		return () => window.removeEventListener('pointermove', handlePointerMove)
	}, [dragState, handlePointerMove])

	function startDrag(pointId: string) {
		return (event: React.PointerEvent) => {
			event.stopPropagation()
			const newDragState = { pointId }
			setDragState(newDragState)
			dragStateRef.current = newDragState
		}
	}

	function handlePointerUpLocal() {
		// Window handler performs linking logic - this is just for cleanup
		// when pointer is released directly on the overlay
		setDragState(null)
		setSnapTarget(null)
		setPlayerSnapTarget(null)
		dragStateRef.current = null
		snapTargetRef.current = null
		playerSnapTargetRef.current = null
	}

	return (
		<g
			ref={overlayRef}
			pointerEvents={isGlobalSelect ? 'none' : 'visiblePainted'}
			onPointerUp={handlePointerUpLocal}
		>
		{/* Iterate over point pool instead of nested segments */}
		{Object.values(drawing.points).map((point) => {
			// Hide the specific point that's linked to player
			if (drawing.playerId && drawing.linkedPointId == point.id) {
				return null
			}

			const pixel = coordSystem.feetToPixels(point.x, point.y)
			return (
				<circle
					key={point.id}
					cx={pixel.x}
					cy={pixel.y}
					r={6}
					fill='white'
					stroke={drawing.style.color}
					strokeWidth={2}
					pointerEvents={isGlobalSelect ? 'none' : 'all'}
					style={
						isGlobalSelect
							? undefined
							: { cursor: dragState ? 'grabbing' : 'grab' }
					}
					onPointerDown={isGlobalSelect ? undefined : startDrag(point.id)}
				/>
			)
		})}
			{!isGlobalSelect && snapTarget && (
				<circle
					cx={coordSystem.feetToPixels(
						snapTarget.point.x,
						snapTarget.point.y,
					).x}
					cy={coordSystem.feetToPixels(
						snapTarget.point.x,
						snapTarget.point.y,
					).y}
					r={10}
					fill='none'
					stroke='#22c55e'
					strokeWidth={3}
					pointerEvents='none'
				/>
			)}
			{!isGlobalSelect && playerSnapTarget && (
				<circle
					cx={coordSystem.feetToPixels(
						playerSnapTarget.point.x,
						playerSnapTarget.point.y,
					).x}
					cy={coordSystem.feetToPixels(
						playerSnapTarget.point.x,
						playerSnapTarget.point.y,
					).y}
					r={PLAYER_RADIUS_FEET * coordSystem.scale + 6}
					fill='rgba(59,130,246,0.2)'
					stroke='#3b82f6'
					strokeWidth={3}
					pointerEvents='none'
					className='animate-pulse'
					style={{
						filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.6))',
					}}
				/>
			)}
		</g>
	)
}

