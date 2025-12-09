import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import type { Drawing } from '../../types/drawing.types'
import { findSnapTarget } from '../../utils/drawing.utils'
import type { SnapTarget } from '../../utils/drawing.utils'

interface ControlPointOverlayProps {
	drawing: Drawing | null
	drawings: Drawing[]
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
}

interface DragState {
	pointId: string
	snapTarget?: SnapTarget | null
}

export function ControlPointOverlay({
	drawing,
	drawings,
	coordSystem,
	snapThreshold,
	isGlobalSelect = false,
	onDragPoint,
	onMerge,
}: ControlPointOverlayProps) {
	if (!drawing) return null
	const [dragState, setDragState] = useState<DragState | null>(null)
	const [snapTarget, setSnapTarget] = useState<SnapTarget | null>(null)
	const overlayRef = useRef<SVGGElement | null>(null)

	const handlePointerUp = useCallback(() => {
		setDragState(null)
		setSnapTarget(null)
	}, [])

	useEffect(() => {
		window.addEventListener('pointerup', handlePointerUp)
		return () => window.removeEventListener('pointerup', handlePointerUp)
	}, [handlePointerUp])

	const handlePointerMove = useCallback(
		(event: PointerEvent) => {
			if (!dragState || !onDragPoint) return
			const svg = overlayRef.current?.ownerSVGElement
			if (!svg) return

			const rect = svg.getBoundingClientRect()
			const pixelX = event.clientX - rect.left
			const pixelY = event.clientY - rect.top
			const feet = coordSystem.pixelsToFeet(pixelX, pixelY)

			onDragPoint(drawing.id, dragState.pointId, feet.x, feet.y)

			const thresholdFeet = snapThreshold / coordSystem.scale
			const target = findSnapTarget(
				feet,
				drawings,
				drawing.id,
				thresholdFeet,
			)
			setSnapTarget(target)
		},
		[dragState, onDragPoint, drawing.id, coordSystem, drawings, snapThreshold],
	)

	useEffect(() => {
		if (!dragState) return
		window.addEventListener('pointermove', handlePointerMove)
		return () => window.removeEventListener('pointermove', handlePointerMove)
	}, [dragState, handlePointerMove])

	const startDrag = (pointId: string) => (event: React.PointerEvent) => {
		event.stopPropagation()
		setDragState({ pointId })
	}

	const handlePointerUpLocal = () => {
		if (snapTarget && dragState && onMerge) {
			onMerge(
				drawing.id,
				dragState.pointId,
				snapTarget.drawingId,
				snapTarget.pointId,
			)
		}
		setDragState(null)
		setSnapTarget(null)
	}

	return (
		<g
			ref={overlayRef}
			pointerEvents={isGlobalSelect ? 'none' : 'visiblePainted'}
			onPointerUp={handlePointerUpLocal}
		>
			{drawing.segments.map((segment) =>
				segment.points.map((point) => {
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
				}),
			)}
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
		</g>
	)
}

