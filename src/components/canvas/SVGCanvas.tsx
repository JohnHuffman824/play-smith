import { useState, useEffect } from 'react'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import { PathRenderer } from './PathRenderer'
import { ControlPointOverlay } from './ControlPointOverlay'
import { MultiDrawingControlPointOverlay } from './MultiDrawingControlPointOverlay'
import { FreehandCapture } from './FreehandCapture'
import { DrawingPropertiesDialog } from '../toolbar/dialogs/DrawingPropertiesDialog'
import type { PathStyle, Drawing, ControlPoint } from '../../types/drawing.types'
import { pointToLineDistance } from '../../utils/canvas.utils'
import type { Coordinate } from '../../types/field.types'
import {
	mergeDrawings,
	getDrawingStartPoint,
	getDrawingEndPoint,
	findPlayerSnapTarget,
	deletePointFromDrawing
} from '../../utils/drawing.utils'
import { convertToSharp, extractMainCoordinates } from '../../utils/curve.utils'
import { processSmoothPath } from '../../utils/smooth-path.utils'
import { PLAYER_RADIUS_FEET } from '../../constants/field.constants'

// Constants
const NODE_PROXIMITY_THRESHOLD = 20

type Player = {
	id: string
	x: number
	y: number
	label: string
	color: string
}

interface SVGCanvasProps {
	width: number
	height: number
	coordSystem: FieldCoordinateSystem
	drawings: Drawing[]
	players?: Player[]
	onChange: (drawings: Drawing[]) => void
	activeTool: 'draw' | 'select' | 'erase'
	autoCorrect: boolean
	defaultStyle: PathStyle
	onDeleteDrawing?: (id: string) => void
	eraseSize?: number
	snapThreshold: number
	selectedDrawingIds?: string[]
	onLinkDrawingToPlayer?: (
		drawingId: string,
		pointId: string,
		playerId: string,
	) => void
	onPlayerLinked?: (playerId: string, position: { x: number; y: number }) => void
	onMovePlayer?: (
		playerId: string,
		x: number,
		y: number,
	) => void
	isOverCanvas?: boolean
	cursorPosition?: { x: number; y: number } | null
	onSelectionChange?: (id: string | null) => void
	onDrawingHoverChange?: (isHovered: boolean) => void
}

/**
* Interactive SVG layer for drawing and editing paths.
*/
export function SVGCanvas({
	width,
	height,
	coordSystem,
	drawings,
	isOverCanvas = false,
	cursorPosition,
	players,
	onChange,
	activeTool,
	autoCorrect,
	defaultStyle,
	onDeleteDrawing,
	eraseSize = 0,
	snapThreshold,
	selectedDrawingIds = [],
	onLinkDrawingToPlayer,
	onPlayerLinked,
	onMovePlayer,
	onSelectionChange,
	onDrawingHoverChange,
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
	const [editingDrawing, setEditingDrawing] = useState<{
		drawing: Drawing
		position: { x: number; y: number }
	} | null>(null)
	const [wholeDrawingSnapTarget, setWholeDrawingSnapTarget] = useState<{
		playerId: string
		pointId: string
		playerPosition: { x: number; y: number }
	} | null>(null)

	// Auto-clear lastDrawnDrawingId after 3 seconds
	useEffect(() => {
		if (lastDrawnDrawingId) {
			const timeout = setTimeout(() => {
				setLastDrawnDrawingId(null)
			}, 3000)

			return () => clearTimeout(timeout)
		}
	}, [lastDrawnDrawingId])

	function handleCommit(drawing: Drawing) {
		onChange([...drawings, drawing])
		setSelectedDrawingId(drawing.id)
		setLastDrawnDrawingId(drawing.id)
		onSelectionChange?.(drawing.id)
	}

	function handleSelect(id: string) {
		setSelectedDrawingId(id)
		setLastDrawnDrawingId(null)
		onSelectionChange?.(id)
	}

	function handleSelectWithDialog(id: string, position: { x: number; y: number }) {
		setSelectedDrawingId(id)
		setLastDrawnDrawingId(null)
		onSelectionChange?.(id)

		const drawing = drawings.find((d) => d.id === id)
		if (drawing) {
			setEditingDrawing({ drawing, position })
		}
	}

	function handleDragPoint(
		drawingId: string,
		pointId: string,
		x: number,
		y: number,
	) {
		// With shared point pool: just update the single point!
		// All segments referencing it will automatically use the new position
		onChange(
			drawings.map((drawing) => {
				if (drawing.id !== drawingId) return drawing
				return {
					...drawing,
					points: {
						...drawing.points,
						[pointId]: { ...drawing.points[pointId]!, x, y },
					},
				}
			}),
		)
	}

	function handleMerge(
		sourceDrawingId: string,
		sourcePointId: string,
		targetDrawingId: string,
		targetPointId: string,
	) {
		const source = drawings.find((item) => item.id === sourceDrawingId)
		const target = drawings.find((item) => item.id === targetDrawingId)

		if (!source || !target) {
			return
		}

		try {
			const merged = mergeDrawings(
				source,
				target,
				sourcePointId,
				targetPointId,
			)

			const remaining = drawings.filter(
				(item) => item.id !== sourceDrawingId && item.id !== targetDrawingId,
			)

			onChange([...remaining, merged])
			setSelectedDrawingId(merged.id)
			setLastDrawnDrawingId(null)
		} catch (error) {
			console.error('Error during merge:', error)
		}
	}

	function handleLinkToPlayer(
		drawingId: string,
		pointId: string,
		playerId: string,
	) {
		if (onLinkDrawingToPlayer) {
			onLinkDrawingToPlayer(drawingId, pointId, playerId)
		}
	}

	function handleDeletePoint(drawingId: string, pointId: string) {
		const drawing = drawings.find(d => d.id === drawingId)
		if (!drawing) return

		const updatedDrawing = deletePointFromDrawing(drawing, pointId)

		if (updatedDrawing === null) {
			// Drawing should be deleted entirely
			onChange(drawings.filter(d => d.id !== drawingId))
		} else {
			// Update the drawing with the point removed
			onChange(drawings.map(d => d.id === drawingId ? updatedDrawing : d))
		}
	}

	function handleDrawingDragStart(
		drawingId: string,
		feetX: number,
		feetY: number,
	) {
		setDrawingDragState({
			drawingId,
			startFeet: { x: feetX, y: feetY },
		})
		setSelectedDrawingId(drawingId)
	}

	function handleDrawingDragMove(event: React.PointerEvent<SVGSVGElement>) {
		if (!drawingDragState) return
		const rect = event.currentTarget.getBoundingClientRect()
		const pixelX = event.clientX - rect.left
		const pixelY = event.clientY - rect.top
		const currentFeet = coordSystem.pixelsToFeet(pixelX, pixelY)
		const deltaX = currentFeet.x - drawingDragState.startFeet.x
		const deltaY = currentFeet.y - drawingDragState.startFeet.y

		// Find the drawing being moved
		const movedDrawing = drawings.find(
			(d) => d.id === drawingDragState.drawingId,
		)

		// If drawing is linked to a player, move the player too
		if (movedDrawing?.playerId && onMovePlayer && players) {
			const player = players.find((p) => p.id === movedDrawing.playerId)
			if (player) {
				onMovePlayer(
					player.id,
					player.x + deltaX,
					player.y + deltaY,
				)
			}
		}

		onChange(
			drawings.map((drawing) => {
				if (drawing.id !== drawingDragState.drawingId) return drawing
				// Update all points in the shared pool
				const updatedPoints: Record<string, ControlPoint> = {}
				for (const [id, point] of Object.entries(drawing.points)) {
					updatedPoints[id] = {
						...point,
						x: point.x + deltaX,
						y: point.y + deltaY,
					}
				}
				return { ...drawing, points: updatedPoints }
			}),
		)

		// Snap detection for linking to players during whole-drawing drag
		// Skip if drawing is already linked to a player
		if (movedDrawing?.playerId) {
			setWholeDrawingSnapTarget(null)
		} else if (movedDrawing && players && players.length > 0) {
			// Build updated drawing with new point positions
			const updatedDrawing = {
				...movedDrawing,
				points: Object.fromEntries(
					Object.entries(movedDrawing.points).map(([id, point]) => [
						id,
						{ ...point, x: point.x + deltaX, y: point.y + deltaY }
					])
				),
			}

			const startPoint = getDrawingStartPoint(updatedDrawing)
			const endPoint = getDrawingEndPoint(updatedDrawing)
			const threshold = PLAYER_RADIUS_FEET

			let bestTarget: {
				playerId: string
				pointId: string
				playerPosition: { x: number; y: number }
				distance: number
			} | null = null

			// Check start point
			if (startPoint) {
				const snap = findPlayerSnapTarget(
					{ x: startPoint.x, y: startPoint.y },
					players,
					threshold
				)
				if (snap && (!bestTarget || snap.distance < bestTarget.distance)) {
					bestTarget = {
						playerId: snap.playerId,
						pointId: startPoint.id,
						playerPosition: snap.point,
						distance: snap.distance,
					}
				}
			}

			// Check end point
			if (endPoint && endPoint.id !== startPoint?.id) {
				const snap = findPlayerSnapTarget(
					{ x: endPoint.x, y: endPoint.y },
					players,
					threshold
				)
				if (snap && (!bestTarget || snap.distance < bestTarget.distance)) {
					bestTarget = {
						playerId: snap.playerId,
						pointId: endPoint.id,
						playerPosition: snap.point,
						distance: snap.distance,
					}
				}
			}

			setWholeDrawingSnapTarget(
				bestTarget
					? {
							playerId: bestTarget.playerId,
							pointId: bestTarget.pointId,
							playerPosition: bestTarget.playerPosition,
					  }
					: null
			)
		} else {
			// Clear snap target if no players or conditions not met
			setWholeDrawingSnapTarget(null)
		}

		setDrawingDragState({
			drawingId: drawingDragState.drawingId,
			startFeet: currentFeet,
		})
	}

	function handleDrawingDragEnd(event?: React.PointerEvent<SVGSVGElement>) {
		// Link to player if snap target exists
		if (wholeDrawingSnapTarget && drawingDragState && onLinkDrawingToPlayer) {
			// CRITICAL: Move entire drawing to maintain shape before linking
			// Find the drawing and the point that will be linked
			const drawing = drawings.find((d) => d.id === drawingDragState.drawingId)
			const linkedPoint = drawing?.points[wholeDrawingSnapTarget.pointId]

			if (drawing && linkedPoint) {
				// Calculate delta from linked point's current position to player position
				const deltaX = wholeDrawingSnapTarget.playerPosition.x - linkedPoint.x
				const deltaY = wholeDrawingSnapTarget.playerPosition.y - linkedPoint.y

				// Move ALL points in the drawing by this delta to maintain shape
				const updatedPoints: Record<string, ControlPoint> = {}
				for (const [id, point] of Object.entries(drawing.points)) {
					updatedPoints[id] = {
						...point,
						x: point.x + deltaX,
						y: point.y + deltaY,
					}
				}

				// Update the drawing with all points moved
				onChange(
					drawings.map((d) =>
						d.id === drawing.id
							? { ...d, points: updatedPoints }
							: d
					)
				)
			}

			// Now link the point to the player (point is already at player position)
			onLinkDrawingToPlayer(
				drawingDragState.drawingId,
				wholeDrawingSnapTarget.pointId,
				wholeDrawingSnapTarget.playerId,
			)

			// Show player dialog after linking
			if (onPlayerLinked && event) {
				onPlayerLinked(wholeDrawingSnapTarget.playerId, {
					x: event.clientX,
					y: event.clientY,
				})
			}
		}
		setDrawingDragState(null)
		setWholeDrawingSnapTarget(null)
	}

	function handleDrawingDoubleClick(
		drawingId: string,
		position: { x: number; y: number },
	) {
		const drawing = drawings.find((d) => d.id === drawingId)
		if (drawing) {
			setEditingDrawing({ drawing, position })
		}
	}

	function handleDrawingStyleUpdate(updates: Partial<PathStyle>) {
		if (!editingDrawing) return

		const drawing = editingDrawing.drawing
		let newDrawing = { ...drawing, style: { ...drawing.style, ...updates } }

		// If pathMode changed, convert geometry
		if (updates.pathMode && updates.pathMode !== drawing.style.pathMode) {
			if (updates.pathMode === 'curve') {
				// Convert to smooth using smooth pipeline
				const coords = extractMainCoordinates(drawing)
				const { points, segments } = processSmoothPath(coords)
				newDrawing = { ...newDrawing, points, segments }
			} else {
				// Convert to sharp using convertToSharp
				const { points, segments } = convertToSharp(drawing)
				newDrawing = { ...newDrawing, points, segments }
			}
		}

		onChange(drawings.map((d) => (d.id === drawing.id ? newDrawing : d)))
		setEditingDrawing({ ...editingDrawing, drawing: newDrawing })
	}

	return (
		<div className='absolute top-0 left-0 w-full h-full overflow-hidden' style={{ borderRadius: 'inherit' }}>
			<svg
				width={width}
				height={height}
				className='absolute top-0 left-0 w-full h-full pointer-events-auto'
				onPointerMove={handleDrawingDragMove}
				onPointerUp={(e) => handleDrawingDragEnd(e)}
				onPointerDown={(e) => {
					if (activeTool === 'erase') {
					const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
					const click: Coordinate = {
						x: e.clientX - rect.left,
						y: e.clientY - rect.top,
					}
					const hit = drawings.find((drawing) => {
						// Flatten all points from segments into pixels
						const pixels = drawing.segments.flatMap((segment) =>
							segment.pointIds.map((pointId) => {
								const point = drawing.points[pointId]
								return point ? coordSystem.feetToPixels(point.x, point.y) : null
							}).filter((p): p is Coordinate => p !== null)
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
						setSelectedDrawingId((prev) => (prev === hit.id ? null : prev))
						setLastDrawnDrawingId((prev) =>
							prev === hit.id ? null : prev,
						)
					}
				} else if (activeTool === 'select' && e.target === e.currentTarget) {
					// Clicking empty space in select mode clears selection
					setSelectedDrawingId(null)
					onSelectionChange?.(null)
				}
			}}
			>
			{drawings.map((drawing) => (
				<PathRenderer
					key={drawing.id}
					drawing={drawing}
					coordSystem={coordSystem}
					onSelect={handleSelect}
					onSelectWithPosition={handleSelectWithDialog}
					isSelected={selectedDrawingIds.includes(drawing.id)}
					activeTool={activeTool}
					onDelete={onDeleteDrawing}
					onDragStart={handleDrawingDragStart}
					onHover={onDrawingHoverChange}
				/>
			))}

			{/* Show draggable nodes for all drawings when SELECT tool is active */}
			{activeTool === 'select' && isOverCanvas && (
				<MultiDrawingControlPointOverlay
					drawings={drawings}
					selectedDrawingIds={selectedDrawingIds}
					players={players}
					coordSystem={coordSystem}
					snapThreshold={snapThreshold}
					cursorPosition={cursorPosition}
					proximityThreshold={NODE_PROXIMITY_THRESHOLD}
					onDragPoint={handleDragPoint}
					onMerge={handleMerge}
					onLinkToPlayer={handleLinkToPlayer}
					onDeletePoint={activeTool === 'select' ? handleDeletePoint : undefined}
				/>
			)}

			{/* Show draggable nodes for selected drawing when cursor is over canvas (non-SELECT tools) */}
			{activeTool !== 'select' && selectedDrawingIds.length > 0 && (
				<ControlPointOverlay
					drawing={
						drawings.find((item) => selectedDrawingIds.includes(item.id))
					}
					drawings={drawings}
					players={players}
					coordSystem={coordSystem}
					snapThreshold={snapThreshold}
					onDragPoint={handleDragPoint}
					onMerge={handleMerge}
					onLinkToPlayer={handleLinkToPlayer}
				/>
			)}

			{/* Player snap indicator during whole-drawing drag */}
			{drawingDragState && wholeDrawingSnapTarget && (
				<circle
					cx={coordSystem.feetToPixels(
						wholeDrawingSnapTarget.playerPosition.x,
						wholeDrawingSnapTarget.playerPosition.y
					).x}
					cy={coordSystem.feetToPixels(
						wholeDrawingSnapTarget.playerPosition.x,
						wholeDrawingSnapTarget.playerPosition.y
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
			</svg>

			<FreehandCapture
				coordSystem={coordSystem}
				style={defaultStyle}
				isActive={activeTool === 'draw'}
				autoCorrect={autoCorrect}
				onCommit={handleCommit}
				players={players}
			/>

		{activeTool === 'draw' && lastDrawnDrawingId && isOverCanvas && (
			<div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
				<svg
					width={width}
					height={height}
					className='absolute top-0 left-0 w-full h-full pointer-events-none'
				>
					<ControlPointOverlay
						drawing={
							drawings.find((item) => item.id === lastDrawnDrawingId)
						}
						drawings={drawings}
						players={players}
						coordSystem={coordSystem}
						snapThreshold={snapThreshold}
						onDragPoint={handleDragPoint}
						onMerge={handleMerge}
						onLinkToPlayer={handleLinkToPlayer}
					/>
				</svg>
			</div>
		)}

		{editingDrawing && (
			<DrawingPropertiesDialog
				drawing={editingDrawing.drawing}
				position={editingDrawing.position}
				onUpdate={handleDrawingStyleUpdate}
				onClose={() => setEditingDrawing(null)}
				coordSystem={coordSystem}
			/>
		)}
		</div>
	)
}

