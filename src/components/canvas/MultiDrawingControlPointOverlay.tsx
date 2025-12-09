import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing } from '../../types/drawing.types'
import { findSnapTarget, findPlayerSnapTarget } from '../../utils/drawing.utils'
import type { SnapTarget, PlayerSnapTarget } from '../../utils/drawing.utils'
import { PLAYER_RADIUS_FEET } from '../../constants/field.constants'

interface MultiDrawingControlPointOverlayProps {
	drawings: Drawing[]
	players?: Array<{ id: string; x: number; y: number; label: string; color: string }>
	coordSystem: FieldCoordinateSystem
	snapThreshold: number
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

interface MultiDragState {
	drawingId: string // Which drawing owns the dragged point
	pointId: string // Which point is being dragged
}

/**
 * Unified overlay that renders draggable control points for ALL drawings.
 * Eliminates race conditions from multiple overlay components.
 */
export function MultiDrawingControlPointOverlay({
	drawings,
	players,
	coordSystem,
	snapThreshold,
	onDragPoint,
	onMerge,
	onLinkToPlayer,
}: MultiDrawingControlPointOverlayProps) {
	const [dragState, setDragState] = useState<MultiDragState | null>(null)
	const [snapTarget, setSnapTarget] = useState<SnapTarget | null>(null)
	const [playerSnapTarget, setPlayerSnapTarget] = useState<PlayerSnapTarget | null>(null)
	const overlayRef = useRef<SVGGElement | null>(null)

	// Use refs to avoid stale closure issues in handlePointerUp
	const snapTargetRef = useRef<SnapTarget | null>(null)
	const playerSnapTargetRef = useRef<PlayerSnapTarget | null>(null)
	const dragStateRef = useRef<MultiDragState | null>(null)

	// SINGLE window pointerup handler - no race conditions
	const handlePointerUp = useCallback(function handlePointerUp() {
		const currentDragState = dragStateRef.current
		const currentSnapTarget = snapTargetRef.current
		const currentPlayerSnapTarget = playerSnapTargetRef.current

		if (!currentDragState) {
			return
		}

		if (currentPlayerSnapTarget && onLinkToPlayer) {
			onLinkToPlayer(
				currentDragState.drawingId,
				currentDragState.pointId,
				currentPlayerSnapTarget.playerId,
			)
		} else if (currentSnapTarget && onMerge) {
			onMerge(
				currentDragState.drawingId,
				currentDragState.pointId,
				currentSnapTarget.drawingId,
				currentSnapTarget.pointId,
			)
		}

		// Clean up
		setDragState(null)
		setSnapTarget(null)
		setPlayerSnapTarget(null)
		dragStateRef.current = null
		snapTargetRef.current = null
		playerSnapTargetRef.current = null
	}, [onLinkToPlayer, onMerge])

	useEffect(() => {
		window.addEventListener('pointerup', handlePointerUp)
		return () => window.removeEventListener('pointerup', handlePointerUp)
	}, [handlePointerUp])

	// SINGLE window pointermove handler
	const handlePointerMove = useCallback(
		function handlePointerMove(event: PointerEvent) {
			if (!dragState || !onDragPoint) return
			const svg = overlayRef.current?.ownerSVGElement
			if (!svg) return

			const rect = svg.getBoundingClientRect()
			const pixelX = event.clientX - rect.left
			const pixelY = event.clientY - rect.top
			const feet = coordSystem.pixelsToFeet(pixelX, pixelY)

			onDragPoint(dragState.drawingId, dragState.pointId, feet.x, feet.y)

			const playerRadiusFeet = PLAYER_RADIUS_FEET

			// Check for player snap first (takes priority)
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

			// Check for drawing snap (exclude source drawing)
			setPlayerSnapTarget(null)
			playerSnapTargetRef.current = null
			const thresholdFeet = snapThreshold / coordSystem.scale
			const target = findSnapTarget(
				feet,
				drawings,
				dragState.drawingId, // Exclude source drawing
				thresholdFeet,
			)
			setSnapTarget(target)
			snapTargetRef.current = target
		},
		[
			dragState,
			onDragPoint,
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

	// Start drag for a specific drawing's point
	function startDrag(drawingId: string, pointId: string) {
		return (event: React.PointerEvent) => {
			event.stopPropagation()
			const newDragState = { drawingId, pointId }
			setDragState(newDragState)
			dragStateRef.current = newDragState
		}
	}

	// Collect all control points from shared point pools
	// No deduplication needed - each drawing's point pool already has unique points!
	const controlPoints: Array<{
		drawingId: string
		pointId: string
		x: number
		y: number
		color: string
	}> = []

	for (const drawing of drawings) {
		// Iterate over the point pool directly
		for (const [pointId, point] of Object.entries(drawing.points)) {
			// Skip points linked to players
			if (drawing.playerId && drawing.linkedPointId == pointId) {
				continue
			}

			controlPoints.push({
				drawingId: drawing.id,
				pointId: point.id,
				x: point.x,
				y: point.y,
				color: drawing.style.color,
			})
		}
	}

	return (
		<g ref={overlayRef} pointerEvents="visiblePainted">
			{/* Render control points from shared pools */}
			{controlPoints.map((cp) => {
				const pixel = coordSystem.feetToPixels(cp.x, cp.y)
				return (
					<circle
						key={`${cp.drawingId}-${cp.pointId}`}
						cx={pixel.x}
						cy={pixel.y}
						r={6}
						fill='white'
						stroke={cp.color}
						strokeWidth={2}
						pointerEvents='all'
						style={{ cursor: dragState ? 'grabbing' : 'grab' }}
						onPointerDown={startDrag(cp.drawingId, cp.pointId)}
					/>
				)
			})}

			{/* Snap indicator for drawing endpoints */}
			{snapTarget && (
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

			{/* Snap indicator for player positions */}
			{playerSnapTarget && (
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
