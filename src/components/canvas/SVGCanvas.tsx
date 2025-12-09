import { useState } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import { PathRenderer } from './PathRenderer'
import { ControlPointOverlay } from './ControlPointOverlay'
import { FreehandCapture } from './FreehandCapture'
import type { PathStyle, Drawing } from '../../types/drawing.types'
import { pointToLineDistance } from '../../utils/canvas.utils'
import type { Coordinate } from '../../types/field.types'
import { mergeDrawings } from '../../utils/drawing.utils'

interface SVGCanvasProps {
	width: number
	height: number
	coordSystem: FieldCoordinateSystem
	drawings: Drawing[]
	onChange: (drawings: Drawing[]) => void
	activeTool: 'draw' | 'select' | 'erase'
	autoCorrect: boolean
	defaultStyle: PathStyle
	onDeleteDrawing?: (id: string) => void
	eraseSize?: number
	snapThreshold: number
}

export function SVGCanvas({
	width,
	height,
	coordSystem,
	drawings,
	onChange,
	activeTool,
	autoCorrect,
	defaultStyle,
	onDeleteDrawing,
	eraseSize = 0,
	snapThreshold,
}: SVGCanvasProps) {
	const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
		null,
	)
	const [lastDrawnDrawingId, setLastDrawnDrawingId] =
		useState<string | null>(null)
	const [drawingDragState, setDrawingDragState] = useState<{
		drawingId: string
		startFeet: Coordinate
	} | null>(null)

	const handleCommit = (drawing: Drawing) => {
		onChange([...drawings, drawing])
		console.log('[SVGCanvas] committed drawing', {
			id: drawing.id,
			segments: drawing.segments.length,
		})
		setSelectedDrawingId(drawing.id)
		setLastDrawnDrawingId(drawing.id)
	}

	const handleSelect = (id: string) => {
		console.log('[SVGCanvas] handleSelect', { id })
		setSelectedDrawingId(id)
		setLastDrawnDrawingId(null)
	}

	const handleDragPoint = (
		drawingId: string,
		pointId: string,
		x: number,
		y: number,
	) => {
		onChange(
			drawings.map((drawing) => {
				if (drawing.id != drawingId) return drawing
				console.log('[SVGCanvas] drag point', {
					drawingId,
					pointId,
					x,
					y,
				})
				const updatedSegments = drawing.segments.map((segment) => ({
					...segment,
					points: segment.points.map((point) =>
						point.id == pointId ? { ...point, x, y } : point,
					),
				}))
				return { ...drawing, segments: updatedSegments }
			}),
		)
	}

	const handleMerge = (
		sourceDrawingId: string,
		sourcePointId: string,
		targetDrawingId: string,
		targetPointId: string,
	) => {
		const source = drawings.find((item) => item.id == sourceDrawingId)
		const target = drawings.find((item) => item.id == targetDrawingId)
		if (!source || !target) return

		const merged = mergeDrawings(
			source,
			target,
			sourcePointId,
			targetPointId,
		)

		const remaining = drawings.filter(
			(item) => item.id != sourceDrawingId && item.id != targetDrawingId,
		)

		onChange([...remaining, merged])
		setSelectedDrawingId(merged.id)
		setLastDrawnDrawingId(null)
	}

	const handleDrawingDragStart = (
		drawingId: string,
		feetX: number,
		feetY: number,
	) => {
		console.log('[SVGCanvas] handleDrawingDragStart', {
			drawingId,
			feetX,
			feetY,
		})
		setDrawingDragState({
			drawingId,
			startFeet: { x: feetX, y: feetY },
		})
		setSelectedDrawingId(drawingId)
	}

	const handleDrawingDragMove = (event: React.PointerEvent<SVGSVGElement>) => {
		if (!drawingDragState) return
		console.log('[SVGCanvas] handleDrawingDragMove', {
			drawingId: drawingDragState.drawingId,
		})
		const rect = event.currentTarget.getBoundingClientRect()
		const pixelX = event.clientX - rect.left
		const pixelY = event.clientY - rect.top
		const currentFeet = coordSystem.pixelsToFeet(pixelX, pixelY)
		const deltaX = currentFeet.x - drawingDragState.startFeet.x
		const deltaY = currentFeet.y - drawingDragState.startFeet.y

		onChange(
			drawings.map((drawing) => {
				if (drawing.id != drawingDragState.drawingId) return drawing
				const updatedSegments = drawing.segments.map((segment) => ({
					...segment,
					points: segment.points.map((point) => ({
						...point,
						x: point.x + deltaX,
						y: point.y + deltaY,
					})),
				}))
				return { ...drawing, segments: updatedSegments }
			}),
		)

		setDrawingDragState({
			drawingId: drawingDragState.drawingId,
			startFeet: currentFeet,
		})
	}

	const handleDrawingDragEnd = () => {
		if (drawingDragState) {
			console.log('[SVGCanvas] handleDrawingDragEnd', {
				drawingId: drawingDragState.drawingId,
			})
		}
		setDrawingDragState(null)
	}

	return (
		<div className='absolute top-0 left-0 w-full h-full'>
			<svg
				width={width}
				height={height}
				className='absolute top-0 left-0 w-full h-full pointer-events-auto'
				onPointerMove={handleDrawingDragMove}
				onPointerUp={handleDrawingDragEnd}
				onPointerDown={(e) => {
					if (activeTool != 'erase') return
					const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
					const click: Coordinate = {
						x: e.clientX - rect.left,
						y: e.clientY - rect.top,
					}
					const hit = drawings.find((drawing) => {
						const pixels = drawing.segments.flatMap((segment) =>
							segment.points.map((p) => coordSystem.feetToPixels(p.x, p.y)),
						)
						for (let i = 0; i < pixels.length - 1; i++) {
							const p1 = pixels[i]!
							const p2 = pixels[i + 1]!
							const dist = pointToLineDistance(click, p1, p2)
							if (dist <= eraseSize / 2) return true
						}
						return false
					})
					if (hit && onDeleteDrawing) {
						onDeleteDrawing(hit.id)
						setSelectedDrawingId((prev) => (prev == hit.id ? null : prev))
						setLastDrawnDrawingId((prev) =>
							prev == hit.id ? null : prev,
						)
					}
				}}
			>
			{drawings.map((drawing) => (
				<PathRenderer
					key={drawing.id}
					drawing={drawing}
					coordSystem={coordSystem}
					onSelect={handleSelect}
					isSelected={selectedDrawingId == drawing.id}
					activeTool={activeTool}
					onDelete={onDeleteDrawing}
					onDragStart={handleDrawingDragStart}
				/>
			))}

			{/* Show all nodes in select mode */}
			{activeTool == 'select' &&
				drawings.map((drawing) => (
					<ControlPointOverlay
						key={`overlay-${drawing.id}`}
						drawing={drawing}
						drawings={drawings}
						coordSystem={coordSystem}
						snapThreshold={snapThreshold}
						isGlobalSelect={true}
					/>
				))}

			{/* Show draggable nodes for selected drawing */}
			{selectedDrawingId && (
				<ControlPointOverlay
					drawing={
						drawings.find((item) => item.id == selectedDrawingId) ??
							null
					}
					drawings={drawings}
					coordSystem={coordSystem}
					snapThreshold={snapThreshold}
					onDragPoint={handleDragPoint}
					onMerge={handleMerge}
				/>
			)}
			</svg>

			<FreehandCapture
				coordSystem={coordSystem}
				style={defaultStyle}
				isActive={activeTool == 'draw'}
				autoCorrect={autoCorrect}
				onCommit={handleCommit}
			/>

			{activeTool == 'draw' && lastDrawnDrawingId && (
				<div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
					<svg
						width={width}
						height={height}
						className='absolute top-0 left-0 w-full h-full pointer-events-none'
					>
						<ControlPointOverlay
							drawing={
								drawings.find((item) => item.id == lastDrawnDrawingId) ??
									null
							}
							drawings={drawings}
							coordSystem={coordSystem}
							snapThreshold={snapThreshold}
							onDragPoint={handleDragPoint}
							onMerge={handleMerge}
						/>
					</svg>
				</div>
			)}
		</div>
	)
}

