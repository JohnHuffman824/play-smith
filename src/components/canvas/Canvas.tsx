import {useRef, useEffect, useState} from 'react'
import type {DrawingState} from '../../types/play.types'
import type {HashAlignment} from '../../types/field.types'
import {useFieldCoordinates} from '../../hooks/useFieldCoordinates'
import {usePlayContext} from '../../contexts/PlayContext'
import {useCanvasViewport} from '../../contexts/CanvasViewportContext'
import {eventBus} from '../../services/EventBus'
import {
	PLAYER_RADIUS_FEET,
	INITIALIZATION_DELAY_MS,
	CURSOR_Z_INDEX,
	MAX_HISTORY_SIZE,
	TOOL_DRAW,
	TOOL_ERASE,
	TOOL_SELECT,
	TOOL_FILL,
	TOOL_ADD_PLAYER,
	EVENT_FILL_PLAYER,
	UNLINK_DISTANCE_FEET,
	MIN_ZOOM,
	MAX_ZOOM,
	ZOOM_SENSITIVITY,
} from '../../constants/field.constants'
import {SVGCanvas} from './SVGCanvas'
import type {
	ControlPoint,
	Drawing,
	PathStyle,
} from '../../types/drawing.types'
import {FootballField} from '../field/FootballField'
import {Player} from '../player/Player'
import {PlayerLabelDialog} from '../player/PlayerLabelDialog'
import {DrawingPropertiesDialog} from '../toolbar/dialogs/DrawingPropertiesDialog'
import {Pencil, PaintBucket} from 'lucide-react'
import {calculateUnlinkPosition, findDrawingSnapTarget} from '../../utils/drawing.utils'
import {applyLOSSnap} from '../../utils/los-snap.utils'
import {convertToSharp, extractMainCoordinates} from '../../utils/curve.utils'
import {processSmoothPath} from '../../utils/smooth-path.utils'
import {toast} from 'sonner'
import {
	validatePreSnapMovement,
	playerHasPreSnapMovement as checkPlayerHasPreSnapMovement,
} from '../../utils/presnap-validation.utils'
import './canvas.css'

const HEADER_TOOLBAR_HEIGHT = 88
const PLAY_BAR_HEIGHT = 325
const CANVAS_HEIGHT_WITH_PLAY_BAR = HEADER_TOOLBAR_HEIGHT + PLAY_BAR_HEIGHT
const ANIMATION_DURATION_MS = 800

interface CanvasProps {
	drawingState: DrawingState
	hashAlignment: HashAlignment
	showPlayBar: boolean
	playId?: string
	containerMode?: 'viewport' | 'fill'
	showFieldMarkings?: boolean
}

// Helper to dispatch fill events
function dispatchFillEvent(
	eventName: string,
	id: string,
	color: string,
) {
	if (eventName == EVENT_FILL_PLAYER) {
		eventBus.emit('player:fill', {id, color})
	}
}

function findNeighborPoint(
	linkedDrawing: Drawing,
	linkedPointId: string,
): ControlPoint | null {
	for (const segment of linkedDrawing.segments) {
		const pointIndex = segment.pointIds.indexOf(linkedPointId)
		if (pointIndex == -1) continue
		if (pointIndex > 0) {
			const prevId = segment.pointIds[pointIndex - 1]
			return linkedDrawing.points[prevId!]
		}
		if (pointIndex < segment.pointIds.length - 1) {
			const nextId = segment.pointIds[pointIndex + 1]
			return linkedDrawing.points[nextId!]
		}
	}
	return null
}

function computeUnlinkTarget(
	player: { x: number; y: number },
	neighborPoint: ControlPoint | null,
) {
	if (!neighborPoint) {
		return {x: player.x, y: player.y - UNLINK_DISTANCE_FEET}
	}
	return calculateUnlinkPosition(
		{x: player.x, y: player.y},
		{x: neighborPoint.x, y: neighborPoint.y},
		UNLINK_DISTANCE_FEET,
	)
}

export function Canvas({
	                       drawingState,
	                       hashAlignment: _hashAlignment,
	                       showPlayBar,
	                       playId: _playId,
	                       containerMode = 'viewport',
	                       showFieldMarkings: _showFieldMarkings = false,
                       }: CanvasProps) {
	const whiteboardRef = useRef<HTMLDivElement>(null);
	const panStartRef = useRef<{ x: number; y: number } | null>(null);
	const panOriginRef = useRef<{ x: number; y: number } | null>(null);
	const [cursorPosition, setCursorPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [isOverCanvas, setIsOverCanvas] = useState(false);
	const [isHoveringDeletable, setIsHoveringDeletable] =
		useState(false);
	const [showLabelDialog, setShowLabelDialog] = useState(false);
	const [selectedPlayerId, setSelectedPlayerId] = useState<
		string | null
	>(null);
	const [labelDialogPosition, setLabelDialogPosition] =
		useState({x: 0, y: 0});
	const [editingDrawing, setEditingDrawing] = useState<{
		drawing: Drawing;
		position: { x: number; y: number };
	} | null>(null);
	const [placementMode, setPlacementMode] = useState<{
		type: 'presnap';
		drawingId: string;
	} | null>(null);
	const {state, setDrawings, setPlayers, dispatch} = usePlayContext()
	const {drawings = [], players: contextPlayers = []} = state || {}
	const players = contextPlayers || []
	const [canvasDimensions, setCanvasDimensions] = useState({
		width: 0,
		height: 0,
	})

	// Coordinate system for converting between feet and pixels
	const coordSystem = useFieldCoordinates({
		containerWidth: canvasDimensions.width,
		containerHeight: canvasDimensions.height,
	})

	// Viewport state for zoom and pan
	const {zoom, panX, panY, isPanning, panMode, setViewport} = useCanvasViewport()

	const strokeFeet =
		coordSystem.scale > 0
			? drawingState.brushSize / coordSystem.scale
			: drawingState.brushSize

	const defaultPathStyle: PathStyle = {
		color: drawingState.color,
		strokeWidth: strokeFeet,
		lineStyle: drawingState.lineStyle,
		lineEnd: drawingState.lineEnd,
		pathMode: drawingState.pathMode,
	}

	// History state for undo functionality
	interface HistorySnapshot {
		drawings: typeof drawings
		players: typeof players
	}

	const [history, setHistory] = useState<HistorySnapshot[]>([])

	// Helper function to save current state to history
	function saveToHistory() {
		const snapshot: HistorySnapshot = {
			drawings: JSON.parse(JSON.stringify(drawings)),
			players: JSON.parse(JSON.stringify(players)),
		}

		setHistory((prev) => {
			const newHistory = [...prev, snapshot]
			if (newHistory.length > MAX_HISTORY_SIZE) {
				return newHistory.slice(-MAX_HISTORY_SIZE)
			}
			return newHistory
		})
	}

	// Track changes and save snapshots for undo
	useEffect(() => {
		if (drawings.length == 0 && players.length == 0) return
		saveToHistory()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [drawings, players])

	// Handle undo event
	useEffect(() => {
		function handleUndo() {
			// Need at least 2 history entries to undo (current + previous)
			if (history.length < 2) return

			const previousSnapshot = history[history.length - 2]

			setDrawings(previousSnapshot.drawings)
			setPlayers(previousSnapshot.players)

			setHistory((prev) => prev.slice(0, -2))
		}

		eventBus.on('canvas:undo', handleUndo)
		return () => eventBus.off('canvas:undo', handleUndo)
	}, [history, setDrawings, setPlayers])

	// Handle clear canvas event (drawings only, players managed by PlayContext)
	useEffect(() => {
		function handleClear() {
			setDrawings([])
			// Players including linemen are preserved via PlayContext
		}

		eventBus.on('canvas:clear', handleClear)
		return () => eventBus.off('canvas:clear', handleClear)
	}, [setDrawings])

	// Initialize canvas dimensions
	useEffect(() => {
		function initializeDimensions() {
			if (!whiteboardRef.current) return

			const rect = whiteboardRef.current.getBoundingClientRect()

			setCanvasDimensions({
				width: rect.width,
				height: rect.height,
			})
		}

		const timer = setTimeout(
			initializeDimensions,
			INITIALIZATION_DELAY_MS,
		)
		return () => clearTimeout(timer)
	}, [])

	// Add resize handler to update dimensions and trigger re-render
	useEffect(() => {
		function handleResize() {
			if (!whiteboardRef.current) return;
			const rect =
				whiteboardRef.current.getBoundingClientRect();
			setCanvasDimensions({
				width: rect.width,
				height: rect.height,
			});
		}

		eventBus.on('system:resize', handleResize);
		return () => eventBus.off('system:resize', handleResize);
	}, []);

	// Update dimensions when showPlayBar changes - synced with CSS transitions
	useEffect(() => {
		if (!whiteboardRef.current) return;

		const whiteboard = whiteboardRef.current;

		function updateDimensions() {
			if (!whiteboard) return;
			const rect = whiteboard.getBoundingClientRect();
			setCanvasDimensions({
				width: rect.width,
				height: rect.height,
			});
		}

		const resizeObserver = new ResizeObserver(() => {
			updateDimensions();
		});

		resizeObserver.observe(whiteboard);
		updateDimensions();

		return () => {
			resizeObserver.disconnect();
		};
	}, [showPlayBar]);

	// Attach wheel event listener for zoom (non-passive to allow preventDefault)
	useEffect(() => {
		const element = whiteboardRef.current
		if (!element) return

		element.addEventListener('wheel', handleWheel, {passive: false})
		return () => element.removeEventListener('wheel', handleWheel)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [zoom, panX, panY, canvasDimensions])

	// Keyboard event listeners for spacebar pan
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.code === 'Space' && !event.repeat && zoom > MIN_ZOOM && !isPanning) {
				event.preventDefault()
				// Don't set isPanning here - that happens on mousedown
				setViewport({
					panMode: 'spacebar',
				})
			}
		}

		function handleKeyUp(event: KeyboardEvent) {
			if (event.code === 'Space' && panMode === 'spacebar') {
				event.preventDefault()
				setViewport({
					isPanning: false,
					panMode: null,
				})
				panStartRef.current = null
				panOriginRef.current = null
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		document.addEventListener('keyup', handleKeyUp)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('keyup', handleKeyUp)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [zoom, panMode, isPanning])

	function getCursorStyle() {
		if (isPanning) return 'grabbing'
		if (panMode === 'spacebar' && zoom > MIN_ZOOM) return 'grab'

		switch (drawingState.tool) {
			case TOOL_ERASE:
			case TOOL_DRAW:
			case TOOL_FILL:
			case TOOL_ADD_PLAYER:
				return "none";
			default:
				return "default";
		}
	}

	// Helper to determine if custom cursor should be visible
	function shouldShowCustomCursor(): boolean {
		return !isPanning && panMode !== 'spacebar'
	}

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		if (!whiteboardRef.current) return;
		const rect = whiteboardRef.current.getBoundingClientRect();
		setCursorPosition({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});

		// Handle panning
		if (isPanning && panStartRef.current && panOriginRef.current) {
			const deltaX = e.clientX - panStartRef.current.x
			const deltaY = e.clientY - panStartRef.current.y

			// 1:1 mouse tracking - no zoom division
			// panX maps directly to screen pixels due to CSS transform math
			const newPanX = panOriginRef.current.x + deltaX
			const newPanY = panOriginRef.current.y + deltaY

			const clamped = clampPan(newPanX, newPanY, zoom)
			setViewport({panX: clamped.panX, panY: clamped.panY})
		}
	}

	function handleMouseEnter() {
		setIsOverCanvas(true);
	}

	function handleMouseLeave() {
		setIsOverCanvas(false);
		setCursorPosition(null);
	}

	// Zoom/Pan helper functions
	function calculateCursorCenteredZoom(
		cursorX: number,
		cursorY: number,
		oldZoom: number,
		newZoom: number,
		oldPanX: number,
		oldPanY: number
	): { newPanX: number; newPanY: number } {
		// Point under cursor in canvas space
		const canvasX = (cursorX - oldPanX) / oldZoom
		const canvasY = (cursorY - oldPanY) / oldZoom

		// New pan to keep that point under cursor
		const newPanX = cursorX - canvasX * newZoom
		const newPanY = cursorY - canvasY * newZoom

		return {newPanX, newPanY}
	}

	function clampPan(
		newPanX: number,
		newPanY: number,
		currentZoom: number
	): { panX: number; panY: number } {
		const containerWidth = canvasDimensions.width
		const containerHeight = canvasDimensions.height

		// Content size at current zoom
		const contentWidth = containerWidth * currentZoom
		const contentHeight = containerHeight * currentZoom

		// Maximum pan is when content edge reaches container edge
		const maxPanX = 0 // Left edge cannot go past container left
		const minPanX = containerWidth - contentWidth // Right edge cannot go past container right

		const maxPanY = 0
		const minPanY = containerHeight - contentHeight

		return {
			panX: Math.max(minPanX, Math.min(maxPanX, newPanX)),
			panY: Math.max(minPanY, Math.min(maxPanY, newPanY)),
		}
	}

	function handleWheel(event: WheelEvent) {
		if (!whiteboardRef.current) return

		event.preventDefault()

		// Get cursor position relative to container
		const rect = whiteboardRef.current.getBoundingClientRect()
		const cursorX = event.clientX - rect.left
		const cursorY = event.clientY - rect.top

		// Calculate zoom delta (positive = zoom in, negative = zoom out)
		const delta = -event.deltaY * ZOOM_SENSITIVITY

		// Calculate new zoom, clamped to bounds
		const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta))

		// Only zoom IN (ignore zoom out past baseline)
		if (newZoom < MIN_ZOOM) return

		// Calculate cursor-centered zoom
		const {newPanX, newPanY} = calculateCursorCenteredZoom(
			cursorX,
			cursorY,
			zoom,
			newZoom,
			panX,
			panY
		)

		// Clamp pan to bounds
		const clamped = clampPan(newPanX, newPanY, newZoom)

		// Reset pan when returning to baseline
		if (newZoom === MIN_ZOOM) {
			setViewport({zoom: MIN_ZOOM, panX: 0, panY: 0})
		} else {
			setViewport({zoom: newZoom, panX: clamped.panX, panY: clamped.panY})
		}
	}

	function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
		// Spacebar pan start (left-click while spacebar held)
		if (panMode === 'spacebar' && event.button === 0) {
			event.preventDefault()
			setViewport({isPanning: true})
			panStartRef.current = {x: event.clientX, y: event.clientY}
			panOriginRef.current = {x: panX, y: panY}
			return
		}

		// Middle mouse button = button 1
		if (event.button === 1 && zoom > MIN_ZOOM) {
			event.preventDefault()
			setViewport({
				isPanning: true,
				panMode: 'middleMouse',
			})
			panStartRef.current = {x: event.clientX, y: event.clientY}
			panOriginRef.current = {x: panX, y: panY}
		}
	}

	function handleMouseUp() {
		if (isPanning) {
			setViewport({
				isPanning: false,
				panMode: null,
			})
			panStartRef.current = null
			panOriginRef.current = null
		}
	}

	function handleCanvasClick(
		e: React.MouseEvent<HTMLDivElement>,
	) {
		if (drawingState.tool != TOOL_ADD_PLAYER) return
		if (!whiteboardRef.current) return

		const rect = whiteboardRef.current.getBoundingClientRect()
		const screenX = e.clientX - rect.left
		const screenY = e.clientY - rect.top

		// Use viewport-aware coordinate conversion
		const feetCoords = coordSystem.screenToFeet(screenX, screenY, zoom, panX, panY)

		// Apply LOS snapping to initial placement
		const snappedCoords = applyLOSSnap(feetCoords.x, feetCoords.y)

		const newPlayer = {
			id: `player-${Date.now()}`,
			x: snappedCoords.x,
			y: snappedCoords.y,
			label: '',
			color: drawingState.color,
		}

		setPlayers([...players, newPlayer])

		// Auto-link to nearby drawing control point if one exists
		const drawingTarget = findDrawingSnapTarget(
			snappedCoords,
			drawings,
			PLAYER_RADIUS_FEET,
		)
		if (drawingTarget) {
			handleLinkDrawingToPlayer(
				drawingTarget.drawingId,
				drawingTarget.pointId,
				newPlayer.id,
			)
		}

		setSelectedPlayerId(newPlayer.id)
		setLabelDialogPosition({x: e.clientX, y: e.clientY})
		setShowLabelDialog(true)
	}

	function handleMovePlayerOnly(
		id: string,
		x: number,
		y: number,
	) {
		// Just move the player without moving linked drawings
		// Used when drawing is being moved and player should follow
		setPlayers(
			players.map((p) => (p.id == id ? {...p, x, y} : p))
		)
	}

	function handlePlayerPositionChange(
		id: string,
		newX: number,
		newY: number,
	) {
		const player = players.find((p) => p.id == id)
		if (!player) return

		if (player.isLineman) {
			// Calculate offset from original position
			const offsetX = newX - player.x
			const offsetY = newY - player.y

			// Move all linemen by same offset
			const updatedPlayers = players.map((p) => {
				if (!p.isLineman) return p
				return {...p, x: p.x + offsetX, y: p.y + offsetY}
			})
			setPlayers(updatedPlayers)
		} else {
			const deltaX = newX - player.x
			const deltaY = newY - player.y

			// Normal single-player update
			dispatch({type: 'UPDATE_PLAYER', id, updates: {x: newX, y: newY}})

			// Move any linked drawings by the same delta
			const linkedDrawings = drawings.filter((d) => d.playerId == id)
			if (linkedDrawings.length > 0) {
				setDrawings(
					drawings.map((drawing) => {
						if (drawing.playerId != id) return drawing
						// Update all points in the shared pool
						const updatedPoints: Record<string, import('../../types/drawing.types').ControlPoint> = {}
						for (const [pointId, point] of Object.entries(drawing.points)) {
							updatedPoints[pointId] = {
								...point,
								x: point.x + deltaX,
								y: point.y + deltaY,
							}
						}
						return {
							...drawing,
							points: updatedPoints,
						}
					}),
				)
			}
		}
	}

	function handlePlayerLabelClick(
		id: string,
		x: number,
		y: number,
	) {
		if (drawingState.tool == TOOL_SELECT) {
			setSelectedPlayerId(id);
			setLabelDialogPosition({x, y});
			setShowLabelDialog(true);
		}
	}

	function handlePlayerLabelChange(label: string) {
		if (selectedPlayerId) {
			setPlayers(
				players.map((p) =>
					p.id == selectedPlayerId ? {...p, label} : p
				)
			);
		}
	}

	function handlePlayerDelete() {
		if (selectedPlayerId) {
			setPlayers(
				players.filter((p) => p.id != selectedPlayerId)
			);
			setShowLabelDialog(false);
			setSelectedPlayerId(null);
		}
	}

	function handlePlayerDeleteById(id: string) {
		const player = players.find((p) => p.id == id)
		if (player?.isLineman) return // Protected from deletion

		setPlayers(players.filter((p) => p.id != id));
		// Reset hover state when deleting a player to show circular cursor again
		setIsHoveringDeletable(false);
		// If the deleted player was selected, close the dialog
		if (selectedPlayerId == id) {
			setShowLabelDialog(false);
			setSelectedPlayerId(null);
		}
	}

	function handleFillPlayer(id: string) {
		if (drawingState.tool == TOOL_FILL) {
			dispatchFillEvent(
				EVENT_FILL_PLAYER,
				id,
				drawingState.color,
			);
		}
	}

	function handleDrawingSelectWithDialog(
		id: string,
		position: { x: number; y: number }
	) {
		const drawing = drawings.find((d) => d.id == id);
		if (drawing) {
			setEditingDrawing({drawing, position});
		}
	}

	function handleDrawingStyleUpdate(updates: Partial<PathStyle>) {
		if (!editingDrawing) return;

		const drawing = editingDrawing.drawing;
		let updatedDrawing = {
			...drawing,
			style: {...drawing.style, ...updates},
		};

		// If pathMode changed, convert geometry
		if (updates.pathMode && updates.pathMode !== drawing.style.pathMode) {
			if (updates.pathMode === 'curve') {
				// Convert to smooth using smooth pipeline
				const coords = extractMainCoordinates(drawing);
				const {points, segments} = processSmoothPath(coords);
				updatedDrawing = {...updatedDrawing, points, segments};
			} else {
				// Convert to sharp using convertToSharp
				const {points, segments} = convertToSharp(drawing);
				updatedDrawing = {...updatedDrawing, points, segments};
			}
		}

		setDrawings(
			drawings.map((d) =>
				d.id == editingDrawing.drawing.id ? updatedDrawing : d
			)
		);
		setEditingDrawing({...editingDrawing, drawing: updatedDrawing});
	}

	// Check if a player already has pre-snap movement on another drawing
	function playerHasPreSnapMovement(playerId: string, excludeDrawingId?: string): boolean {
		return checkPlayerHasPreSnapMovement(playerId, drawings, excludeDrawingId);
	}

	// Handle Add/Remove Pre-Snap Movement button click
	function handlePreSnapMovement() {
		if (!editingDrawing) return;

		const drawing = editingDrawing.drawing;

		// If already has pre-snap motion, remove it
		if (drawing.preSnapMotion) {
			// Build the updated drawing
			let updatedDrawing = { ...drawing, preSnapMotion: undefined };

			// If it was a motion, also remove the snap point from points
			if (drawing.preSnapMotion.type === 'motion' && drawing.preSnapMotion.snapPointId) {
				const { [drawing.preSnapMotion.snapPointId]: _removed, ...remainingPoints } = drawing.points;
				updatedDrawing = { ...updatedDrawing, points: remainingPoints };
			}

			setDrawings(drawings.map(d =>
				d.id === drawing.id ? updatedDrawing : d
			));

			// If it was a shift, remove the ghost player
			if (drawing.preSnapMotion.type === 'shift' && drawing.playerId) {
				setPlayers(players.filter(p =>
					!(p.isGhost && p.sourcePlayerId === drawing.playerId)
				));
			}

			return;
		}

		// Enter placement mode to add pre-snap movement
		setPlacementMode({
			type: 'presnap',
			drawingId: drawing.id,
		});
	}

	// Handle placement mode clicks on the drawing
	function handlePreSnapPlacementClick(
		drawingId: string,
		clickType: 'terminal' | 'path',
		point: { x: number; y: number },
		pointId?: string
	) {
		const drawing = drawings.find(d => d.id === drawingId);
		if (!drawing || !drawing.playerId) return;

		// Validate before applying pre-snap movement
		const validationError = validatePreSnapMovement(drawing, drawings, clickType);
		if (validationError) {
			toast.error(validationError);
			setPlacementMode(null);
			return;
		}

		if (clickType === 'terminal') {
			// Create Shift - ghost player at terminal position
			const sourcePlayer = players.find(p => p.id === drawing.playerId);
			if (!sourcePlayer) return;

			const ghostPlayer = {
				id: `ghost-${Date.now()}`,
				x: point.x,
				y: point.y,
				label: sourcePlayer.label,
				color: sourcePlayer.color,
				isGhost: true,
				sourcePlayerId: drawing.playerId,
			};

			setPlayers([...players, ghostPlayer]);

			// Update drawing with shift pre-snap motion
			setDrawings(drawings.map(d =>
				d.id === drawingId
					? { ...d, preSnapMotion: { type: 'shift' } }
					: d
			));
		} else {
			// Create Motion - snap point at clicked location
			// Insert a new control point at the clicked location
			const snapPointId = `snap-${Date.now()}`;
			const newPoint: ControlPoint = {
				id: snapPointId,
				x: point.x,
				y: point.y,
				type: 'snap',
			};

			// Add the snap point to the drawing's point pool
			const updatedDrawing = {
				...drawing,
				points: {
					...drawing.points,
					[snapPointId]: newPoint,
				},
				preSnapMotion: {
					type: 'motion' as const,
					snapPointId,
				},
			};

			setDrawings(drawings.map(d =>
				d.id === drawingId ? updatedDrawing : d
			));
		}

		// Exit placement mode
		setPlacementMode(null);
	}

	function handleLinkDrawingToPlayer(
		drawingId: string,
		pointId: string,
		playerId: string,
	) {
		const existingLink = drawings.find((d) => d.playerId == playerId)
		if (existingLink) return

		const player = players.find((p) => p.id == playerId)
		if (!player) return

		setDrawings(
			drawings.map((drawing) => {
				if (drawing.id != drawingId) return drawing

				// Update the linked point in the shared pool
				const updatedPoints = {
					...drawing.points,
					[pointId]: {
						...drawing.points[pointId]!,
						x: player.x,
						y: player.y,
					},
				}

				return {
					...drawing,
					playerId,
					linkedPointId: pointId,
					points: updatedPoints,
				}
			}),
		)
	}

	function handleAddPlayerAtNode(
		drawingId: string,
		pointId: string,
		x: number,
		y: number,
	) {
		const drawing = drawings.find((d) => d.id === drawingId)
		if (drawing?.playerId) return

		const newPlayer = {
			id: `player-${Date.now()}`,
			x,
			y,
			label: '',
			color: drawingState.color,
		}

		setPlayers([...players, newPlayer])
		handleLinkDrawingToPlayer(drawingId, pointId, newPlayer.id)

		// Show label dialog
		setSelectedPlayerId(newPlayer.id)
		const pixelPos = coordSystem.feetToPixels(x, y)
		const rect = whiteboardRef.current?.getBoundingClientRect()
		setLabelDialogPosition({
			x: pixelPos.x + (rect?.left || 0),
			y: pixelPos.y + (rect?.top || 0),
		})
		setShowLabelDialog(true)
	}

	function handleUnlinkDrawing(playerId: string) {
		const linkedDrawing = drawings.find((d) => d.playerId == playerId)
		if (!linkedDrawing || !linkedDrawing.linkedPointId) return

		const player = players.find((p) => p.id == playerId)
		if (!player) return

		const neighborPoint = findNeighborPoint(
			linkedDrawing,
			linkedDrawing.linkedPointId,
		)
		const newPosition = computeUnlinkTarget(player, neighborPoint)

		setDrawings(
			drawings.map((drawing) => {
				if (drawing.id != linkedDrawing.id) return drawing

				// Update the unlinked point in the shared pool
				const updatedPoints = {
					...drawing.points,
					[linkedDrawing.linkedPointId]: {
						...drawing.points[linkedDrawing.linkedPointId]!,
						x: newPosition.x,
						y: newPosition.y,
					},
				}

				return {
					...drawing,
					playerId: undefined,
					linkedPointId: undefined,
					points: updatedPoints,
				}
			}),
		)
	}

	function handleDeleteDrawing(id: string) {
		setDrawings(drawings.filter((d) => d.id != id))
	}

	// Determine if players should be interactable
	const playerInteractable =
		drawingState.tool == TOOL_SELECT ||
		drawingState.tool == TOOL_FILL ||
		drawingState.tool == TOOL_ERASE

	// Calculate player cursor size to match Player component scale
	const scale = coordSystem.scale
	const playerCursorDiameter = PLAYER_RADIUS_FEET * 2 * scale

	const containerClasses = `canvas-container ${containerMode === 'fill' ? 'canvas-container-fill' : 'canvas-container-viewport'}`

	return (
		<div className={containerClasses}>
			{/* Whiteboard frame with field background */}
			<div
				ref={whiteboardRef}
				className='canvas-whiteboard'
				style={{
					cursor: getCursorStyle(),
					height: containerMode === 'fill'
						? '100%'
						: showPlayBar
							? `calc(100vh - ${CANVAS_HEIGHT_WITH_PLAY_BAR}px)`
							: `calc(100vh - ${HEADER_TOOLBAR_HEIGHT}px)`,
					transition: containerMode === 'fill'
						? undefined
						: `height ${ANIMATION_DURATION_MS}ms ease-in-out`,
					overflow: 'hidden',
				}}
				onMouseMove={handleMouseMove}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onClick={handleCanvasClick}
			>
				{/* Transform container for zoom/pan */}
				<div
					className='canvas-transform-container'
					style={{
						transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
					}}
				>
					{/* Field background fills the whiteboard */}
					<FootballField/>

					{/* SVG layer for structured drawings */}
					<div className='canvas-svg-layer'>
						<SVGCanvas
							width={canvasDimensions.width}
							height={canvasDimensions.height}
							coordSystem={coordSystem}
							drawings={drawings}
							players={players}
							onChange={setDrawings}
							activeTool={
								drawingState.tool == TOOL_DRAW
									? 'draw'
									: drawingState.tool == TOOL_ERASE
										? 'erase'
										: drawingState.tool == TOOL_ADD_PLAYER
											? 'addPlayer'
											: 'select'
							}
							onDeleteDrawing={handleDeleteDrawing}
							eraseSize={drawingState.eraseSize}
							autoCorrect={true}
							defaultStyle={defaultPathStyle}
							snapThreshold={drawingState.snapThreshold}
							zoom={zoom}
							panX={panX}
							panY={panY}
							onLinkDrawingToPlayer={handleLinkDrawingToPlayer}
							onAddPlayerAtNode={handleAddPlayerAtNode}
							placementMode={placementMode}
							onPreSnapPlacementClick={handlePreSnapPlacementClick}
							onMovePlayer={handleMovePlayerOnly}
							isOverCanvas={isOverCanvas}
							cursorPosition={cursorPosition}
							onSelectWithPosition={handleDrawingSelectWithDialog}
						/>
					</div>

					{/* Players - inside transform so they zoom/pan with content */}
					<div className='canvas-players-layer'>
						{players.map((player) => {
							// For ghost players, mirror source player's label and color
							let displayLabel = player.label
							let displayColor = player.color
							if (player.isGhost && player.sourcePlayerId) {
								const sourcePlayer = players.find(p => p.id === player.sourcePlayerId)
								if (sourcePlayer) {
									displayLabel = sourcePlayer.label
									displayColor = sourcePlayer.color
								}
							}
							return (
								<Player
									key={player.id}
									id={player.id}
									initialX={player.x}
									initialY={player.y}
									containerWidth={canvasDimensions.width}
									containerHeight={canvasDimensions.height}
									label={displayLabel}
									color={displayColor}
									onPositionChange={handlePlayerPositionChange}
									onLabelClick={handlePlayerLabelClick}
									isGhost={player.isGhost}
									onFill={handleFillPlayer}
									onDelete={handlePlayerDeleteById}
									currentTool={drawingState.tool}
									interactable={playerInteractable}
									zoom={zoom}
									panX={panX}
									panY={panY}
									onHoverChange={(isHovered) => {
										// Only track hover state when erase tool is active
										if (drawingState.tool == TOOL_ERASE) {
											setIsHoveringDeletable(isHovered)
										}
									}}
								/>
							)
						})}
					</div>
				</div>
				{/* End transform container */}

				{/* Cursor overlay - OUTSIDE transform so cursors stay at mouse position */}
				<div
					className='canvas-cursor-overlay'
					style={{
						cursor: getCursorStyle(),
					}}
				>
					{/* Custom Pencil Cursor - only visible when draw tool is active */}
					{drawingState.tool == TOOL_DRAW &&
						isOverCanvas &&
						cursorPosition &&
						shouldShowCustomCursor() && (
							<div
								className='canvas-cursor-pencil'
								style={{
									left: cursorPosition.x,
									top: cursorPosition.y,
									zIndex: CURSOR_Z_INDEX,
								}}
							>
								<Pencil size={24}/>
							</div>
						)}

					{/* Custom Fill Cursor - paint bucket icon */}
					{drawingState.tool == TOOL_FILL &&
						isOverCanvas &&
						cursorPosition &&
						shouldShowCustomCursor() && (
							<div
								className='canvas-cursor-fill'
								style={{
									left: cursorPosition.x,
									top: cursorPosition.y,
									zIndex: CURSOR_Z_INDEX,
								}}
							>
								<PaintBucket size={24}/>
							</div>
						)}

					{/* Custom Eraser Cursor */}
					{drawingState.tool == TOOL_ERASE &&
						isOverCanvas &&
						cursorPosition &&
						!isHoveringDeletable &&
						shouldShowCustomCursor() && (
							<div
								className='canvas-cursor-eraser'
								style={{
									left: cursorPosition.x,
									top: cursorPosition.y,
									zIndex: CURSOR_Z_INDEX,
								}}
							>
								<div
									className='canvas-eraser-circle'
									style={{
										width: `${drawingState.eraseSize}px`,
										height: `${drawingState.eraseSize}px`,
									}}
								/>
							</div>
						)}

					{/* Custom Add Player Cursor - Player circle preview */}
					{drawingState.tool == TOOL_ADD_PLAYER &&
						isOverCanvas &&
						cursorPosition &&
						shouldShowCustomCursor() && (
							<div
								className='canvas-cursor-add-player'
								style={{
									left: cursorPosition.x,
									top: cursorPosition.y,
									zIndex: CURSOR_Z_INDEX,
								}}
							>
								<div
									className='canvas-add-player-circle'
									style={{
										width: `${playerCursorDiameter}px`,
										height: `${playerCursorDiameter}px`,
										backgroundColor: drawingState.color,
									}}
								/>
							</div>
						)}

				</div>
			</div>

			{/* Player Label Dialog */}
			{showLabelDialog && selectedPlayerId && (
				<PlayerLabelDialog
					position={labelDialogPosition}
					currentLabel={
						players.find((p) => p.id == selectedPlayerId)
							?.label ?? ''
					}
					hasLinkedDrawing={
						drawings.some((d) => d.playerId == selectedPlayerId)
					}
					onLabelChange={handlePlayerLabelChange}
					onUnlink={() => handleUnlinkDrawing(selectedPlayerId)}
					onDelete={handlePlayerDelete}
					onClose={() => setShowLabelDialog(false)}
				/>
			)}

			{/* Drawing Properties Dialog - outside transform */}
			{editingDrawing && (
				<DrawingPropertiesDialog
					drawing={editingDrawing.drawing}
					position={editingDrawing.position}
					onUpdate={handleDrawingStyleUpdate}
					onClose={() => setEditingDrawing(null)}
					coordSystem={coordSystem}
					onAddPreSnapMovement={handlePreSnapMovement}
					playerHasPreSnapMovement={
						editingDrawing.drawing.playerId
							? playerHasPreSnapMovement(editingDrawing.drawing.playerId, editingDrawing.drawing.id)
							: false
					}
				/>
			)}
		</div>
	);
}