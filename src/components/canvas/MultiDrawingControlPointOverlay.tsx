import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing } from '../../types/drawing.types'
import type { Coordinate } from '../../types/field.types'
import { findSnapTarget, findPlayerSnapTarget } from '../../utils/drawing.utils'
import type { SnapTarget, PlayerSnapTarget } from '../../utils/drawing.utils'
import { PLAYER_RADIUS_FEET } from '../../constants/field.constants'
import { pointToLineDistance } from '../../utils/canvas.utils'
import { NodeDeletePopup } from './NodeDeletePopup'
import { NodeAddPopup } from './NodeAddPopup'

// Constants for proximity filtering
const BEZIER_SAMPLE_POINTS = 10
const DEFAULT_PROXIMITY_THRESHOLD = 20

interface MultiDrawingControlPointOverlayProps {
	drawings: Drawing[]
	selectedDrawingIds?: string[]
	players?: Array<{
		id: string
		x: number
		y: number
		label: string
		color: string
	}>
	coordSystem: FieldCoordinateSystem
	snapThreshold: number
	cursorPosition?: { x: number; y: number } | null
	proximityThreshold?: number
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
	onDeletePoint?: (drawingId: string, pointId: string) => void
	onAddPoint?: (drawingId: string, segmentIndex: number, position: Coordinate) => void
}

interface MultiDragState {
	drawingId: string // Which drawing owns the dragged point
	pointId: string // Which point is being dragged
}

/**
 * Sample points along a cubic bezier curve.
 */
function sampleCubicBezier(
	p0: Coordinate,
	cp1: Coordinate,
	cp2: Coordinate,
	p3: Coordinate,
	numSamples: number,
): Coordinate[] {
	const samples: Coordinate[] = []
	for (let i = 0; i <= numSamples; i++) {
		const t = i / numSamples
		const t2 = t * t
		const t3 = t2 * t
		const mt = 1 - t
		const mt2 = mt * mt
		const mt3 = mt2 * mt

		samples.push({
			x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p3.x,
			y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p3.y,
		})
	}
	return samples
}

/**
 * Calculate minimum distance from a pixel position to any segment of a drawing.
 */
function getDistanceToDrawingPath(
	pixelPos: Coordinate,
	drawing: Drawing,
	coordSystem: FieldCoordinateSystem
): number {
	let minDistance = Infinity

	for (const segment of drawing.segments) {
		const pointIds = segment.pointIds

		if (segment.type === 'line') {
			// Line: two points
			const p1 = drawing.points[pointIds[0]]
			const p2 = drawing.points[pointIds[1]]
			if (!p1 || !p2) continue

			const pixel1 = coordSystem.feetToPixels(p1.x, p1.y)
			const pixel2 = coordSystem.feetToPixels(p2.x, p2.y)
			const dist = pointToLineDistance(pixelPos, pixel1, pixel2)
			minDistance = Math.min(minDistance, dist)

		} else if (segment.type === 'cubic') {
			// Handle both NEW and OLD formats
			if (pointIds.length === 2) {
				// NEW FORMAT: handles in nodes
				const fromPoint = drawing.points[pointIds[0]]
				const toPoint = drawing.points[pointIds[1]]
				if (!fromPoint || !toPoint) continue

				// If handles exist, sample the bezier curve
				if (fromPoint.handleOut && toPoint.handleIn) {
					const p0 = coordSystem.feetToPixels(fromPoint.x, fromPoint.y)
					const cp1X = fromPoint.x + fromPoint.handleOut.x
					const cp1Y = fromPoint.y + fromPoint.handleOut.y
					const cp1 = coordSystem.feetToPixels(cp1X, cp1Y)
					const cp2X = toPoint.x + toPoint.handleIn.x
					const cp2Y = toPoint.y + toPoint.handleIn.y
					const cp2 = coordSystem.feetToPixels(cp2X, cp2Y)
					const p3 = coordSystem.feetToPixels(toPoint.x, toPoint.y)

					const samples = sampleCubicBezier(
						p0,
						cp1,
						cp2,
						p3,
						BEZIER_SAMPLE_POINTS
					)

					for (let i = 0; i < samples.length - 1; i++) {
						const dist = pointToLineDistance(
							pixelPos,
							samples[i],
							samples[i + 1]
						)
						minDistance = Math.min(minDistance, dist)
					}
				} else {
					// Fallback to straight line
					const pixel1 = coordSystem.feetToPixels(fromPoint.x, fromPoint.y)
					const pixel2 = coordSystem.feetToPixels(toPoint.x, toPoint.y)
					const dist = pointToLineDistance(pixelPos, pixel1, pixel2)
					minDistance = Math.min(minDistance, dist)
				}
			} else {
				// OLD FORMAT: separate control points (4 points: start, cp1, cp2, end)
				const p0 = drawing.points[pointIds[0]]
				const cp1 = drawing.points[pointIds[1]]
				const cp2 = drawing.points[pointIds[2]]
				const p3 = drawing.points[pointIds[3]]
				if (!p0 || !cp1 || !cp2 || !p3) continue

				const pixel0 = coordSystem.feetToPixels(p0.x, p0.y)
				const pixelCp1 = coordSystem.feetToPixels(cp1.x, cp1.y)
				const pixelCp2 = coordSystem.feetToPixels(cp2.x, cp2.y)
				const pixel3 = coordSystem.feetToPixels(p3.x, p3.y)

				const samples = sampleCubicBezier(
					pixel0,
					pixelCp1,
					pixelCp2,
					pixel3,
					BEZIER_SAMPLE_POINTS
				)

				for (let i = 0; i < samples.length - 1; i++) {
					const dist = pointToLineDistance(
						pixelPos,
						samples[i],
						samples[i + 1]
					)
					minDistance = Math.min(minDistance, dist)
				}
			}
		} else if (segment.type === 'quadratic') {
			// Approximate quadratic as line for distance calculation
			const control = drawing.points[pointIds[0]]
			const end = drawing.points[pointIds[1]]
			if (!control || !end) continue

			const pixel1 = coordSystem.feetToPixels(control.x, control.y)
			const pixel2 = coordSystem.feetToPixels(end.x, end.y)
			const dist = pointToLineDistance(pixelPos, pixel1, pixel2)
			minDistance = Math.min(minDistance, dist)
		}
	}

	return minDistance
}

/**
 * Unified overlay that renders draggable control points for ALL drawings.
 * Eliminates race conditions from multiple overlay components.
 */
export function MultiDrawingControlPointOverlay({
	drawings,
	selectedDrawingIds = [],
	players,
	coordSystem,
	snapThreshold,
	cursorPosition,
	proximityThreshold = DEFAULT_PROXIMITY_THRESHOLD,
	onDragPoint,
	onMerge,
	onLinkToPlayer,
	onDeletePoint,
	onAddPoint,
}: MultiDrawingControlPointOverlayProps) {
	const [dragState, setDragState] = useState<MultiDragState | null>(null)
	const [snapTarget, setSnapTarget] = useState<SnapTarget | null>(null)
	const [playerSnapTarget, setPlayerSnapTarget] = useState<
		PlayerSnapTarget | null
	>(null)
	const [contextMenuState, setContextMenuState] = useState<{
		drawingId: string
		pointId: string
		pixelPosition: { x: number; y: number }
	} | null>(null)
	const [addPopupState, setAddPopupState] = useState<{
		drawingId: string
		segmentIndex: number
		insertPosition: Coordinate
		pixelPosition: { x: number; y: number }
	} | null>(null)
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

	// Close popup on click outside
	useEffect(() => {
		if (!contextMenuState && !addPopupState) return

		function handleClickOutside(e: MouseEvent) {
			setContextMenuState(null)
			setAddPopupState(null)
		}

		// Use setTimeout to avoid immediately closing from the same event
		const timeout = setTimeout(() => {
			window.addEventListener('click', handleClickOutside)
			window.addEventListener('contextmenu', handleClickOutside)
		}, 0)

		return () => {
			clearTimeout(timeout)
			window.removeEventListener('click', handleClickOutside)
			window.removeEventListener('contextmenu', handleClickOutside)
		}
	}, [contextMenuState, addPopupState])

	// Start drag for a specific drawing's point
	function startDrag(drawingId: string, pointId: string) {
		return (event: React.PointerEvent) => {
			event.stopPropagation()
			const newDragState = { drawingId, pointId }
			setDragState(newDragState)
			dragStateRef.current = newDragState
		}
	}

	// Handle right-click context menu for delete
	function handleContextMenu(
		drawingId: string,
		pointId: string,
		pixelX: number,
		pixelY: number
	) {
		return (event: React.MouseEvent) => {
			event.preventDefault()
			event.stopPropagation()
			setContextMenuState({
				drawingId,
				pointId,
				pixelPosition: { x: pixelX, y: pixelY }
			})
		}
	}

	function handleDeleteFromPopup() {
		if (contextMenuState && onDeletePoint) {
			onDeletePoint(contextMenuState.drawingId, contextMenuState.pointId)
		}
		setContextMenuState(null)
	}

	function handleClosePopup() {
		setContextMenuState(null)
	}

	function handlePathContextMenu(
		drawingId: string,
		segmentIndex: number,
		insertPosition: Coordinate,
		pixelPosition: { x: number; y: number }
	) {
		// Only show add popup if not clicking on a control point
		setContextMenuState(null) // Close delete popup if open
		setAddPopupState({
			drawingId,
			segmentIndex,
			insertPosition,
			pixelPosition
		})
	}

	function handleAddFromPopup() {
		if (addPopupState && onAddPoint) {
			onAddPoint(
				addPopupState.drawingId,
				addPopupState.segmentIndex,
				addPopupState.insertPosition
			)
		}
		setAddPopupState(null)
	}

	// Show nodes for drawings that are EITHER hovered OR selected
	const drawingsToShowNodes = useMemo(() => {
		const hoveredDrawingIds = new Set<string>()

		// Find drawings within proximity threshold (hovered)
		if (cursorPosition) {
			for (const drawing of drawings) {
				const distance = getDistanceToDrawingPath(
					cursorPosition,
					drawing,
					coordSystem
				)
				if (distance <= proximityThreshold) {
					hoveredDrawingIds.add(drawing.id)
				}
			}
		}

		// Union: show nodes for drawings that are hovered OR selected
		return drawings.filter(d =>
			hoveredDrawingIds.has(d.id) || selectedDrawingIds.includes(d.id)
		)
	}, [drawings, cursorPosition, coordSystem, proximityThreshold, selectedDrawingIds])

	// Collect control points only from drawings to show nodes for
	// No deduplication needed - each drawing's point pool already has unique points!
	const controlPoints: Array<{
		drawingId: string
		pointId: string
		x: number
		y: number
		color: string
	}> = []

	for (const drawing of drawingsToShowNodes) {
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
		<g ref={overlayRef} pointerEvents='visiblePainted'>
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
						onContextMenu={handleContextMenu(cp.drawingId, cp.pointId, pixel.x, pixel.y)}
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

			{/* Delete node popup */}
			{contextMenuState && (
				<foreignObject
					x={0}
					y={0}
					width="100%"
					height="100%"
					pointerEvents="none"
					style={{ overflow: 'visible' }}
				>
					<div style={{ pointerEvents: 'auto' }}>
						<NodeDeletePopup
							position={contextMenuState.pixelPosition}
							onDelete={handleDeleteFromPopup}
							onClose={handleClosePopup}
						/>
					</div>
				</foreignObject>
			)}

			{/* Add node popup */}
			{addPopupState && (
				<foreignObject
					x={0}
					y={0}
					width="100%"
					height="100%"
					pointerEvents="none"
					style={{ overflow: 'visible' }}
				>
					<div style={{ pointerEvents: 'auto' }}>
						<NodeAddPopup
							position={addPopupState.pixelPosition}
							onAdd={handleAddFromPopup}
							onClose={() => setAddPopupState(null)}
						/>
					</div>
				</foreignObject>
			)}
		</g>
	)
}
