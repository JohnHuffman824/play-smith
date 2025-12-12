import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { DrawingState } from '../../types/play.types'
import type { HashAlignment } from '../../types/field.types'
import { useFieldCoordinates } from '../../hooks/useFieldCoordinates'
import { usePlayContext } from '../../contexts/PlayContext'
import { eventBus } from '../../services/EventBus'
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
} from '../../constants/field.constants'
import {
	CANVAS_FADE_DURATION_S,
	CANVAS_FADE_DELAY_S,
	CANVAS_FADE_SCALE_START,
} from '../../constants/animation.constants'
import { SVGCanvas } from './SVGCanvas'
import type {
	ControlPoint,
	Drawing,
	PathStyle,
} from '../../types/drawing.types'
import { FootballField } from '../field/FootballField'
import { Player } from '../player/Player'
import { PlayerLabelDialog } from '../player/PlayerLabelDialog'
import { Pencil, PaintBucket } from 'lucide-react'
import { calculateUnlinkPosition, findDrawingSnapTarget } from '../../utils/drawing.utils'
import { applyLOSSnap } from '../../utils/los-snap.utils'

const HEADER_TOOLBAR_HEIGHT = 122
const PLAY_BAR_HEIGHT = 300
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
		eventBus.emit('player:fill', { id, color })
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
		return { x: player.x, y: player.y - UNLINK_DISTANCE_FEET }
	}
	return calculateUnlinkPosition(
		{ x: player.x, y: player.y },
		{ x: neighborPoint.x, y: neighborPoint.y },
		UNLINK_DISTANCE_FEET,
	)
}

export function Canvas({
  drawingState,
  hashAlignment,
  showPlayBar,
  playId,
  containerMode = 'viewport',
  showFieldMarkings = false,
}: CanvasProps) {
  const whiteboardRef = useRef<HTMLDivElement>(null);
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
    useState({ x: 0, y: 0 });
	const { state, setDrawings, setPlayers, dispatch } = usePlayContext()
	const { drawings = [], players: contextPlayers = [] } = state || {}
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
	}, [drawings, players])

	// Handle undo event
	useEffect(() => {
		function handleUndo() {
			if (history.length == 0) return

			const previousSnapshot = history[history.length - 2]

			if (!previousSnapshot) {
				setDrawings([])
				setPlayers([])
				setHistory([])
				return
			}

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

  function getCursorStyle() {
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

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!whiteboardRef.current) return;
    const rect = whiteboardRef.current.getBoundingClientRect();
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function handleMouseEnter() {
    setIsOverCanvas(true);
  }

  function handleMouseLeave() {
    setIsOverCanvas(false);
    setCursorPosition(null);
  }

	function handleCanvasClick(
		e: React.MouseEvent<HTMLDivElement>,
	) {
		if (drawingState.tool != TOOL_ADD_PLAYER) return
		if (!whiteboardRef.current) return

		const rect = whiteboardRef.current.getBoundingClientRect()
		const pixelX = e.clientX - rect.left
		const pixelY = e.clientY - rect.top

		const feetCoords = coordSystem.pixelsToFeet(pixelX, pixelY)

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
		setLabelDialogPosition({ x: e.clientX, y: e.clientY })
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
			players.map((p) => (p.id == id ? { ...p, x, y } : p))
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
				return { ...p, x: p.x + offsetX, y: p.y + offsetY }
			})
			setPlayers(updatedPlayers)
		} else {
			const deltaX = newX - player.x
			const deltaY = newY - player.y

			// Normal single-player update
			dispatch({ type: 'UPDATE_PLAYER', id, updates: { x: newX, y: newY } })

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
      setLabelDialogPosition({ x, y });
      setShowLabelDialog(true);
    }
  }

  function handlePlayerLabelChange(label: string) {
    if (selectedPlayerId) {
      setPlayers(
        players.map((p) =>
          p.id == selectedPlayerId ? { ...p, label } : p
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

	const containerClasses = containerMode === 'fill'
		? 'flex-1 flex items-start justify-center overflow-hidden relative'
		: 'flex-1 flex items-start justify-center px-8 py-4 overflow-hidden relative'

	const whiteboardClasses = [
		'w-full rounded-2xl relative',
		'ring-2 ring-gray-300',
	].join(' ')

	const cursorOverlayClasses =
		'absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden'

	return (
		<div className={containerClasses}>
			{/* Whiteboard frame with field background */}
			<motion.div
				key={playId}
				className="w-full"
				initial={{ opacity: 0, scale: CANVAS_FADE_SCALE_START }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: CANVAS_FADE_DURATION_S, delay: CANVAS_FADE_DELAY_S }}
			>
			<div
				ref={whiteboardRef}
				className={whiteboardClasses}
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
				onClick={handleCanvasClick}
			>
				{/* Field background fills the whiteboard */}
				<FootballField />

				{/* SVG layer for structured drawings */}
				<div className='absolute top-0 left-0 w-full h-full pointer-events-auto overflow-hidden' style={{ borderRadius: 'inherit' }}>
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
						onLinkDrawingToPlayer={handleLinkDrawingToPlayer}
						onAddPlayerAtNode={handleAddPlayerAtNode}
						onMovePlayer={handleMovePlayerOnly}
						isOverCanvas={isOverCanvas}
						cursorPosition={cursorPosition}
					/>
				</div>

				{/* Canvas and interactive overlays */}
				<div
					className={cursorOverlayClasses}
					style={{
						cursor: getCursorStyle(),
						pointerEvents: 'none',
						borderRadius: 'inherit',
					}}
				>
          {/* Custom Pencil Cursor - only visible when draw tool is active */}
          {drawingState.tool == TOOL_DRAW &&
            isOverCanvas &&
            cursorPosition && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: cursorPosition.x,
                  top: cursorPosition.y,
                  transform: "translate(-20%, -90%)",
                  zIndex: CURSOR_Z_INDEX,
                }}
              >
                <Pencil size={24} />
              </div>
            )}

          {/* Custom Fill Cursor - paint bucket icon */}
          {drawingState.tool == TOOL_FILL &&
            isOverCanvas &&
            cursorPosition && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: cursorPosition.x,
                  top: cursorPosition.y,
                  transform: "translate(-20%, -90%) scaleX(-1)",
                  zIndex: CURSOR_Z_INDEX,
                }}
              >
                <PaintBucket size={24} />
              </div>
            )}

          {/* Custom Eraser Cursor */}
          {drawingState.tool == TOOL_ERASE &&
            isOverCanvas &&
            cursorPosition &&
            !isHoveringDeletable && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: cursorPosition.x,
                  top: cursorPosition.y,
                  transform: "translate(-50%, -50%)",
                  zIndex: CURSOR_Z_INDEX,
                }}
              >
                <div
                  style={{
                    width: `${drawingState.eraseSize}px`,
                    height: `${drawingState.eraseSize}px`,
                    borderRadius: "50%",
                    border: "2px solid rgba(0, 0, 0, 0.5)",
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                  }}
                />
              </div>
            )}

          {/* Custom Add Player Cursor - Player circle preview */}
          {drawingState.tool == TOOL_ADD_PLAYER &&
            isOverCanvas &&
            cursorPosition && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: cursorPosition.x,
                  top: cursorPosition.y,
                  transform: "translate(-50%, -50%)",
                  zIndex: CURSOR_Z_INDEX,
                }}
              >
                <div
                  style={{
                    width: `${playerCursorDiameter}px`,
                    height: `${playerCursorDiameter}px`,
                    borderRadius: "50%",
                    backgroundColor: drawingState.color,
                    opacity: 0.6,
                    border:
                      "2px solid rgba(255, 255, 255, 0.8)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  }}
                />
              </div>
            )}

          <div
            className="absolute top-0 left-0 w-full h-full overflow-hidden"
            style={{ pointerEvents: 'none', borderRadius: 'inherit' }}
          >
            {players.map((player) => (
                <Player
                  key={player.id}
                  id={player.id}
                  initialX={player.x}
                  initialY={player.y}
                  containerWidth={canvasDimensions.width}
                  containerHeight={canvasDimensions.height}
                  label={player.label}
                  color={player.color}
                  onPositionChange={handlePlayerPositionChange}
                  onLabelClick={handlePlayerLabelClick}
                  onFill={handleFillPlayer}
                  onDelete={handlePlayerDeleteById}
                  currentTool={drawingState.tool}
                  interactable={playerInteractable}
					onHoverChange={(isHovered) => {
						// Only track hover state when erase tool is active
						if (drawingState.tool == TOOL_ERASE) {
							setIsHoveringDeletable(isHovered)
						}
					}}
                />
              ))}
            </div>
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
			</motion.div>
    </div>
  );
}