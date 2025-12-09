import { useRef, useEffect, useState } from 'react'
import type { DrawingState } from '../../types/play.types'
import type { HashAlignment } from '../../types/field.types'
import { useFieldCoordinates } from '../../hooks/useFieldCoordinates'
import { usePlayContext } from '../../contexts/PlayContext'
import { eventBus } from '../../services/EventBus'
import {
	LINEMAN_Y,
	SPACING_CENTER_TO_CENTER,
	LEFT_HASH_INNER_EDGE,
	RIGHT_HASH_INNER_EDGE,
	CENTER_X,
	PLAYER_RADIUS_FEET,
	INITIALIZATION_DELAY_MS,
	CURSOR_Z_INDEX,
	MAX_HISTORY_SIZE,
	TOOL_DRAW,
	TOOL_ERASE,
	TOOL_SELECT,
	TOOL_FILL,
	TOOL_ADD_PLAYER,
	EVENT_FILL_LINEMAN,
	EVENT_FILL_PLAYER,
} from '../../constants/field.constants'
import { SVGCanvas } from './SVGCanvas'
import type { PathStyle } from '../../types/drawing.types'
import { FootballField } from '../field/FootballField'
import { Lineman } from '../player/Lineman'
import { Player } from '../player/Player'
import { PlayerLabelDialog } from '../player/PlayerLabelDialog'
import { Pencil, PaintBucket } from 'lucide-react'

interface CanvasProps {
	drawingState: DrawingState
	hashAlignment: HashAlignment
	showPlayBar: boolean
}

// Helper to dispatch fill events
function dispatchFillEvent(
  eventName: string,
  id: number | string,
  color: string,
) {
  if (eventName === EVENT_FILL_PLAYER) {
    eventBus.emit('player:fill', { id: id as string, color });
  } else if (eventName === EVENT_FILL_LINEMAN) {
    eventBus.emit('lineman:fill', { id: id as number, color });
  }
}

export function Canvas({
  drawingState,
  hashAlignment,
  showPlayBar,
}: CanvasProps) {
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const [linemanPositions, setLinemanPositions] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [cursorPosition, setCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const [isHoveringDeletable, setIsHoveringDeletable] =
    useState(false);
  const [players, setPlayers] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      label: string;
      color: string;
    }>
  >([]);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<
    string | null
  >(null);
  const [labelDialogPosition, setLabelDialogPosition] =
    useState({ x: 0, y: 0 });
	const { state, setDrawings } = usePlayContext()
	const { drawings } = state
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
	}

	function computeInitialLinemanPositions() {
		let centerLinemanX = CENTER_X
		if (hashAlignment == 'left') {
			centerLinemanX = LEFT_HASH_INNER_EDGE
		} else if (hashAlignment == 'right') {
			centerLinemanX = RIGHT_HASH_INNER_EDGE
		}

		const positions = []
		for (let i = 0; i < 5; i++) {
			const offsetFromCenter = (i - 2) * SPACING_CENTER_TO_CENTER
			positions.push({
				id: i,
				x: centerLinemanX + offsetFromCenter,
				y: LINEMAN_Y,
			})
		}
		return positions
	}

	// History state for undo functionality
	interface HistorySnapshot {
		drawings: typeof drawings
		players: Array<{
			id: string
			x: number
			y: number
			label: string
			color: string
		}>
		linemanPositions: { id: number; x: number; y: number }[]
	}

	const [history, setHistory] = useState<HistorySnapshot[]>([])

	// Helper function to save current state to history
	const saveToHistory = () => {
		const snapshot: HistorySnapshot = {
			drawings: JSON.parse(JSON.stringify(drawings)),
			players: JSON.parse(JSON.stringify(players)),
			linemanPositions: JSON.parse(JSON.stringify(linemanPositions)),
		}
		console.log('[Canvas] saveToHistory', {
			drawings: drawings.length,
			players: players.length,
			linemen: linemanPositions.length,
			historySize: history.length + 1,
		})

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
		const handleUndo = () => {
			if (history.length === 0) return

			const previousSnapshot = history[history.length - 2]

			if (!previousSnapshot) {
				setDrawings([])
				setPlayers([])
				setLinemanPositions(computeInitialLinemanPositions())
				setHistory([])
				return
			}

			setDrawings(previousSnapshot.drawings)
			setPlayers(previousSnapshot.players)
			setLinemanPositions(previousSnapshot.linemanPositions)
			console.log('[Canvas] undo applied', {
				drawings: previousSnapshot.drawings.length,
				players: previousSnapshot.players.length,
				linemen: previousSnapshot.linemanPositions.length,
			})

			setHistory((prev) => prev.slice(0, -2))
		}

		eventBus.on('canvas:undo', handleUndo)
		return () => eventBus.off('canvas:undo', handleUndo)
	}, [history, hashAlignment])

  // Handle clear canvas event (drawings + players + linemen)
  useEffect(() => {
    function handleClear() {
      setDrawings([]);
      setPlayers([]);
      setLinemanPositions(computeInitialLinemanPositions());
      console.log('[Canvas] clear event')
    }

    eventBus.on('canvas:clear', handleClear);
    return () => eventBus.off('canvas:clear', handleClear);
  }, [setDrawings, hashAlignment]);

  // Initialize linemen positions based on the container (stored as feet coordinates)
  useEffect(() => {
    function initializeLinemen() {
      if (!whiteboardRef.current) return;

      const rect =
        whiteboardRef.current.getBoundingClientRect();

      setCanvasDimensions({
        width: rect.width,
        height: rect.height,
      });

      setLinemanPositions(computeInitialLinemanPositions());
    }

    // Initialize after a short delay to ensure container is mounted
    const timer = setTimeout(
      initializeLinemen,
      INITIALIZATION_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [hashAlignment]);

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

  function handleLinemanPositionChange(
    id: number,
    x: number,
    y: number,
  ) {
    setLinemanPositions((prev) => {
      const index = prev.findIndex((p) => p.id == id);
      if (index == -1) return prev;

      // Calculate the offset from the previous position
      const oldPosition = prev[index];
      if (!oldPosition) return prev;
      
      const offsetX = x - oldPosition.x;
      const offsetY = y - oldPosition.y;

      // Move all linemen by the same offset to keep them locked together
      const newPositions = prev.map((p) => ({
        ...p,
        x: p.x + offsetX,
        y: p.y + offsetY,
      }));

      return newPositions;
    });
  }


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

  function handleFillLineman(id: number) {
    if (drawingState.tool == TOOL_FILL) {
      dispatchFillEvent(
        EVENT_FILL_LINEMAN,
        id,
        drawingState.color,
      );
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
    if (drawingState.tool != TOOL_ADD_PLAYER) return;
    if (!whiteboardRef.current) return;

    const rect = whiteboardRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    const feetCoords = coordSystem.pixelsToFeet(pixelX, pixelY);

    const newPlayer = {
      id: `player-${Date.now()}`,
      x: feetCoords.x,
      y: feetCoords.y,
      label: "",
      color: drawingState.color,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setSelectedPlayerId(newPlayer.id);
    setLabelDialogPosition({ x: e.clientX, y: e.clientY });
    setShowLabelDialog(true);
    console.log('[Canvas] add player', newPlayer)
  }

  function handlePlayerPositionChange(
    id: string,
    x: number,
    y: number,
  ) {
    setPlayers((prev) =>
      prev.map((p) => (p.id == id ? { ...p, x, y } : p)),
    );
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
      setPlayers((prev) =>
        prev.map((p) =>
          p.id == selectedPlayerId ? { ...p, label } : p,
        ),
      );
    }
  }

  function handlePlayerDelete() {
    if (selectedPlayerId) {
      setPlayers((prev) =>
        prev.filter((p) => p.id != selectedPlayerId),
      );
      setShowLabelDialog(false);
      setSelectedPlayerId(null);
    }
  }

  function handlePlayerDeleteById(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id != id));
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

  // Determine if linemen should be interactable based on the current tool
  const linemanInteractable =
    drawingState.tool == TOOL_SELECT ||
    drawingState.tool == TOOL_FILL;

  // Determine if players should be interactable
  const playerInteractable =
    drawingState.tool == TOOL_SELECT ||
    drawingState.tool == TOOL_FILL ||
    drawingState.tool == TOOL_ERASE;

  // Calculate player cursor size based on current scale (matches actual Player component size)
  const scale = coordSystem.scale;
  const playerCursorDiameter = PLAYER_RADIUS_FEET * 2 * scale;

  return (
    <div className="flex-1 flex items-start justify-center px-8 py-4 overflow-hidden relative">
      {/* Whiteboard Frame with Field Background - expands/contracts downward, anchored to top */}
      <div
        ref={whiteboardRef}
        className="w-full bg-white rounded-2xl shadow-lg relative border-2 border-gray-300"
        style={{
          cursor: getCursorStyle(),
          height: showPlayBar
            ? "calc(100vh - 302px)"
            : "calc(100vh - 122px)",
          transition: "height 800ms ease-in-out",
          overflow: "hidden",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
      >
        {/* Field background fills the whiteboard and expands with it */}
        <FootballField />

				{/* SVG layer for structured drawings */}
				<div className='absolute top-0 left-0 w-full h-full pointer-events-auto'>
					<SVGCanvas
						width={canvasDimensions.width}
						height={canvasDimensions.height}
						coordSystem={coordSystem}
						drawings={drawings}
						onChange={setDrawings}
						activeTool={
							drawingState.tool == TOOL_DRAW
								? 'draw'
								: drawingState.tool == TOOL_ERASE
									? 'erase'
									: 'select'
						}
						onDeleteDrawing={(id) =>
							setDrawings(
								drawings.filter((drawing) => drawing.id != id),
							)
						}
						eraseSize={drawingState.eraseSize}
						autoCorrect={true}
						defaultStyle={defaultPathStyle}
						snapThreshold={drawingState.snapThreshold}
					/>
				</div>

        {/* Canvas and all interactive elements - as children of whiteboard */}
        <div
          className="absolute top-0 left-0 w-full h-full"
            style={{
              cursor: getCursorStyle(),
              pointerEvents: 'none', // Always none - this div only contains cursor overlays
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
            className="absolute top-0 left-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            {linemanPositions.map((pos) => (
              <Lineman
                key={pos.id}
                id={pos.id}
                initialX={pos.x}
                initialY={pos.y}
                containerWidth={canvasDimensions.width}
                containerHeight={canvasDimensions.height}
                isCenter={pos.id == 2}
                onPositionChange={handleLinemanPositionChange}
                onFill={handleFillLineman}
                interactable={linemanInteractable}
                currentTool={drawingState.tool}
              />
            ))}
          </div>

          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                pointerEvents: 'none',
              }}
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
                    if (drawingState.tool === TOOL_ERASE) {
                      setIsHoveringDeletable(isHovered);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Player Label Dialog */}
      {showLabelDialog && selectedPlayerId && (
        <PlayerLabelDialog
          position={labelDialogPosition}
          currentLabel={
            players.find((p) => p.id == selectedPlayerId)
              ?.label || ""
          }
          onLabelChange={handlePlayerLabelChange}
          onDelete={handlePlayerDelete}
          onClose={() => setShowLabelDialog(false)}
        />
      )}
    </div>
  );
}