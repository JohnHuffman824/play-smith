import {
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
} from "react";
import type { DrawingState } from "../types/play.types";
import type { DrawingObject } from "../types/drawing.types";
import type { HashAlignment } from "../types/field.types";
import { useFieldCoordinates } from "../hooks/useFieldCoordinates";
import {
  FIELD_WIDTH_FEET,
  LINEMAN_RADIUS,
  LINEMAN_Y,
  SPACING_CENTER_TO_CENTER,
  LEFT_HASH_INNER_EDGE,
  RIGHT_HASH_INNER_EDGE,
  CENTER_X,
  PLAYER_RADIUS_FEET,
  DEFAULT_ERASE_SIZE,
  ANGLE_AVERAGE_POINTS,
  ARROW_LENGTH_MULTIPLIER,
  TSHAPE_LENGTH_MULTIPLIER,
  ARROW_ANGLE_DEGREES,
  DASH_PATTERN_LENGTH_MULTIPLIER,
  DASH_PATTERN_GAP_MULTIPLIER,
  INITIALIZATION_DELAY_MS,
  CURSOR_Z_INDEX,
  MAX_HISTORY_SIZE,
  TOOL_DRAW,
  TOOL_ERASE,
  TOOL_SELECT,
  TOOL_FILL,
  TOOL_ADD_PLAYER,
  LINE_END_NONE,
  LINE_END_ARROW,
  LINE_END_TSHAPE,
  EVENT_CLEAR_CANVAS,
  EVENT_FILL_LINEMAN,
  EVENT_FILL_PLAYER,
  EVENT_RESIZE,
  COMPOSITE_DESTINATION_OUT,
  COMPOSITE_SOURCE_OVER,
} from "../constants/field.constants";
import { FootballField } from "./field/FootballField";
import { Lineman } from "./Lineman";
import { Player } from "./Player";
import { PlayerLabelDialog } from "./PlayerLabelDialog";
import { Pencil, PaintBucket } from "lucide-react";

interface CanvasProps {
  drawingState: DrawingState;
  hashAlignment: HashAlignment;
  showPlayBar: boolean;
}

// Helper to get canvas coordinates from mouse event
function getCanvasCoordinates(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  whiteboardRef: React.RefObject<HTMLDivElement>,
) {
  if (!canvasRef.current || !whiteboardRef.current) return null;
  // Use whiteboard rect for consistency with rendering
  const rect = whiteboardRef.current.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    rect,
  };
}

// Helper to dispatch custom events for fill operations
function dispatchFillEvent(
  eventName: string,
  id: number | string,
  color: string,
) {
  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: { id, color },
    }),
  );
}

// Helper to calculate average angle from a series of points
function calculateAverageAngle(
  points: Array<{ x: number; y: number }>,
) {
  if (points.length < 2) return 0;

  const numPointsToAverage = Math.min(
    ANGLE_AVERAGE_POINTS,
    points.length - 1,
  );
  const startIndex = points.length - numPointsToAverage - 1;

  let totalAngle = 0;
  let angleCount = 0;

  for (let i = startIndex; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    totalAngle += segmentAngle;
    angleCount++;
  }

  return totalAngle / angleCount;
}

// Helper to draw arrow head
function drawArrow(
  ctx: CanvasRenderingContext2D,
  endPoint: { x: number; y: number },
  angle: number,
  brushSize: number,
) {
  const arrowLength = brushSize * ARROW_LENGTH_MULTIPLIER;
  const angle1 = angle - ARROW_ANGLE_DEGREES;
  const angle2 = angle + ARROW_ANGLE_DEGREES;

  ctx.beginPath();
  ctx.moveTo(endPoint.x, endPoint.y);
  ctx.lineTo(
    endPoint.x - arrowLength * Math.cos(angle1),
    endPoint.y - arrowLength * Math.sin(angle1),
  );
  ctx.moveTo(endPoint.x, endPoint.y);
  ctx.lineTo(
    endPoint.x - arrowLength * Math.cos(angle2),
    endPoint.y - arrowLength * Math.sin(angle2),
  );
  ctx.stroke();
}

// Helper to draw T-shape
function drawTShape(
  ctx: CanvasRenderingContext2D,
  endPoint: { x: number; y: number },
  angle: number,
  brushSize: number,
) {
  const tLength = brushSize * TSHAPE_LENGTH_MULTIPLIER;
  const perpAngle = angle + Math.PI / 2;

  ctx.beginPath();
  ctx.moveTo(
    endPoint.x - tLength * Math.cos(perpAngle),
    endPoint.y - tLength * Math.sin(perpAngle),
  );
  ctx.lineTo(
    endPoint.x + tLength * Math.cos(perpAngle),
    endPoint.y + tLength * Math.sin(perpAngle),
  );
  ctx.stroke();
}

// Helper to draw line ending (arrow or T-shape)
function drawLineEnding(
  ctx: CanvasRenderingContext2D,
  lineEnd: "none" | "arrow" | "tShape",
  points: Array<{ x: number; y: number }>,
  brushSize: number,
) {
  if (lineEnd == LINE_END_NONE || points.length < 2) return;

  const endPoint = points[points.length - 1];
  const angle = calculateAverageAngle(points);

  ctx.save();
  ctx.setLineDash([]);

  if (lineEnd == LINE_END_ARROW) {
    drawArrow(ctx, endPoint, angle, brushSize);
  } else if (lineEnd == LINE_END_TSHAPE) {
    drawTShape(ctx, endPoint, angle, brushSize);
  }

  ctx.restore();
}

// Helper to render erase stroke
function renderEraseStroke(
  ctx: CanvasRenderingContext2D,
  pixelPoints: Array<{ x: number; y: number }>,
  eraseSize: number,
) {
  ctx.globalCompositeOperation = COMPOSITE_DESTINATION_OUT;
  pixelPoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, eraseSize / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Helper to render draw stroke
function renderDrawStroke(
  ctx: CanvasRenderingContext2D,
  drawing: DrawingObject,
  pixelPoints: Array<{ x: number; y: number }>,
) {
  ctx.globalCompositeOperation = COMPOSITE_SOURCE_OVER;
  ctx.strokeStyle = drawing.color;
  ctx.lineWidth = drawing.brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Set line dash pattern
  if (drawing.lineStyle == "dashed") {
    ctx.setLineDash([
      drawing.brushSize * DASH_PATTERN_LENGTH_MULTIPLIER,
      drawing.brushSize * DASH_PATTERN_GAP_MULTIPLIER,
    ]);
  } else {
    ctx.setLineDash([]);
  }

  // Draw the path
  ctx.beginPath();
  ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
  for (let i = 1; i < pixelPoints.length; i++) {
    ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
  }
  ctx.stroke();

  // Draw line ending if applicable
  drawLineEnding(
    ctx,
    drawing.lineEnd,
    pixelPoints,
    drawing.brushSize,
  );
}

export function Canvas({
  drawingState,
  hashAlignment,
  showPlayBar,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] =
    useState<CanvasRenderingContext2D | null>(null);
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
  const [drawingPath, setDrawingPath] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [currentDrawing, setCurrentDrawing] =
    useState<DrawingObject | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Coordinate system for converting between feet and pixels
  const coordSystem = useFieldCoordinates({
    containerWidth: canvasDimensions.width,
    containerHeight: canvasDimensions.height,
  });

  // History state for undo functionality
  interface HistorySnapshot {
    drawings: DrawingObject[];
    players: Array<{
      id: string;
      x: number;
      y: number;
      label: string;
      color: string;
    }>;
    linemanPositions: { id: number; x: number; y: number }[];
  }

  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  // Helper function to save current state to history
  const saveToHistory = () => {
    const snapshot: HistorySnapshot = {
      drawings: JSON.parse(JSON.stringify(drawings)),
      players: JSON.parse(JSON.stringify(players)),
      linemanPositions: JSON.parse(JSON.stringify(linemanPositions)),
    };

    setHistory((prev) => {
      const newHistory = [...prev, snapshot];
      // Keep only last MAX_HISTORY_SIZE snapshots
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }
      return newHistory;
    });
  };

  // Track changes and save snapshots for undo
  useEffect(() => {
    // Don't save empty initial state
    if (drawings.length === 0 && players.length === 0) return;
    
    saveToHistory();
  }, [drawings.length, players.length]);

  // Handle undo event
  useEffect(() => {
    const handleUndo = () => {
      if (history.length === 0) return;

      // Get the previous snapshot (second to last, as last is current state)
      const previousSnapshot = history[history.length - 2];
      
      if (!previousSnapshot) {
        // If only one snapshot, clear everything
        setDrawings([]);
        setPlayers([]);
        // Reset linemen to initial positions based on hash alignment
        let centerLinemanX = CENTER_X;
        if (hashAlignment == "left") {
          centerLinemanX = LEFT_HASH_INNER_EDGE;
        } else if (hashAlignment == "right") {
          centerLinemanX = RIGHT_HASH_INNER_EDGE;
        }
        const positions = [];
        for (let i = 0; i < 5; i++) {
          const offsetFromCenter = (i - 2) * SPACING_CENTER_TO_CENTER;
          positions.push({
            id: i,
            x: centerLinemanX + offsetFromCenter,
            y: LINEMAN_Y,
          });
        }
        setLinemanPositions(positions);
        setHistory([]);
        return;
      }

      // Restore previous state
      setDrawings(previousSnapshot.drawings);
      setPlayers(previousSnapshot.players);
      setLinemanPositions(previousSnapshot.linemanPositions);
      
      // Remove last two entries from history (current and restoring to previous)
      setHistory((prev) => prev.slice(0, -2));
    };

    window.addEventListener("undoAction", handleUndo);
    return () => window.removeEventListener("undoAction", handleUndo);
  }, [history, hashAlignment]);

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

      // Determine starting X position based on current hash alignment
      let centerLinemanX = CENTER_X;
      if (hashAlignment == "left") {
        centerLinemanX = LEFT_HASH_INNER_EDGE;
      } else if (hashAlignment == "right") {
        centerLinemanX = RIGHT_HASH_INNER_EDGE;
      }

      // Calculate all positions in feet coordinates
      // Center lineman (id=2) is at centerLinemanX
      // Positions: id=0 (far left), id=1 (left), id=2 (center), id=3 (right), id=4 (far right)
      const positions = [];
      for (let i = 0; i < 5; i++) {
        const offsetFromCenter =
          (i - 2) * SPACING_CENTER_TO_CENTER; // -10, -5, 0, 5, 10 feet
        positions.push({
          id: i,
          x: centerLinemanX + offsetFromCenter,
          y: LINEMAN_Y,
        });
      }
      setLinemanPositions(positions);
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

    window.addEventListener(EVENT_RESIZE, handleResize);
    return () =>
      window.removeEventListener(EVENT_RESIZE, handleResize);
  }, []);

  // Update dimensions when showPlayBar changes - synced with CSS transitions
  useLayoutEffect(() => {
    if (!whiteboardRef.current || !canvasRef.current) return;

    const whiteboard = whiteboardRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Function to update canvas size and redraw
    function updateCanvasAndRedraw() {
      if (!whiteboard || !canvas) return;

      const rect = whiteboard.getBoundingClientRect();

      // Resize the canvas element itself
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(
        window.devicePixelRatio,
        window.devicePixelRatio,
      );

      // Update dimensions state
      setCanvasDimensions({
        width: rect.width,
        height: rect.height,
      });

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render all drawings with current dimensions
      drawings.forEach((drawing) => {
        renderDrawing(ctx, drawing, rect.width, rect.height);
      });
    }

    // Use ResizeObserver to watch whiteboard size changes during CSS transition
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasAndRedraw();
    });

    resizeObserver.observe(whiteboard);

    // Also do an immediate update
    updateCanvasAndRedraw();

    return () => {
      resizeObserver.disconnect();
    };
  }, [showPlayBar, drawings]);

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

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function updateCanvasSize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(
        window.devicePixelRatio,
        window.devicePixelRatio,
      );

      // Make canvas transparent so the field shows through
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    updateCanvasSize();
    setContext(ctx);

    window.addEventListener(EVENT_RESIZE, updateCanvasSize);
    return () =>
      window.removeEventListener(
        EVENT_RESIZE,
        updateCanvasSize,
      );
  }, []);

  // Handle clear canvas event
  useEffect(() => {
    function handleClear() {
      if (!context || !canvasRef.current) return;
      const canvas = canvasRef.current;
      context.clearRect(0, 0, canvas.width, canvas.height);
      setDrawings([]);
    }

    window.addEventListener(EVENT_CLEAR_CANVAS, handleClear);
    return () =>
      window.removeEventListener(
        EVENT_CLEAR_CANVAS,
        handleClear,
      );
  }, [context]);

  // Function to render a single drawing object
  function renderDrawing(
    ctx: CanvasRenderingContext2D,
    drawing: DrawingObject,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    if (drawing.points.length == 0) return;

    ctx.save();

    // Convert feet coordinates to pixel coordinates for rendering
    const pixelPoints = drawing.points.map((p) =>
      coordSystem.feetToPixels(p.x, p.y),
    );

    if (drawing.type == TOOL_ERASE) {
      renderEraseStroke(ctx, pixelPoints, drawing.eraseSize);
    } else {
      renderDrawStroke(ctx, drawing, pixelPoints);
    }

    ctx.restore();
  }

  // Redraw all drawings whenever the drawings array changes
  useEffect(() => {
    if (
      !context ||
      !canvasRef.current ||
      !whiteboardRef.current
    )
      return;

    const canvas = canvasRef.current;
    const whiteboard = whiteboardRef.current;
    const rect = whiteboard.getBoundingClientRect();

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Render all drawings in order (both draw and erase strokes)
    // This ensures erase operations are applied in the correct sequence
    drawings.forEach((drawing) => {
      renderDrawing(context, drawing, rect.width, rect.height);
    });
  }, [drawings, context]);

  function startDrawing(
    e: React.MouseEvent<HTMLCanvasElement>,
  ) {
    if (!context) return;

    // Only allow drawing when draw or erase tool is selected
    if (
      drawingState.tool != TOOL_DRAW &&
      drawingState.tool != TOOL_ERASE
    )
      return;

    const coords = getCanvasCoordinates(
      e,
      canvasRef,
      whiteboardRef,
    );
    if (!coords) return;

    setIsDrawing(true);
    setDrawingPath([{ x: coords.x, y: coords.y }]);

    // Convert to feet coordinates for storage
    const feetPoint = coordSystem.pixelsToFeet(coords.x, coords.y);

    // Create a new drawing object with feet coordinates
    const newDrawing: DrawingObject = {
      id: `drawing-${Date.now()}`,
      type:
        drawingState.tool == TOOL_ERASE ? TOOL_ERASE : TOOL_DRAW,
      points: [feetPoint],
      color: drawingState.color,
      brushSize: drawingState.brushSize,
      lineStyle: drawingState.lineStyle,
      lineEnd: drawingState.lineEnd,
      eraseSize: drawingState.eraseSize,
    };

    setCurrentDrawing(newDrawing);

    // Still draw in real-time for preview
    if (drawingState.tool == TOOL_ERASE) {
      // Start erasing immediately
      context.save();
      context.globalCompositeOperation = COMPOSITE_DESTINATION_OUT;
      context.beginPath();
      context.arc(
        coords.x,
        coords.y,
        drawingState.eraseSize / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    } else {
      // Start drawing
      context.globalCompositeOperation = COMPOSITE_SOURCE_OVER;

      if (drawingState.lineStyle == "dashed") {
        context.setLineDash([
          drawingState.brushSize *
            DASH_PATTERN_LENGTH_MULTIPLIER,
          drawingState.brushSize * DASH_PATTERN_GAP_MULTIPLIER,
        ]);
      } else {
        context.setLineDash([]);
      }

      context.beginPath();
      context.moveTo(coords.x, coords.y);
    }
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !context || !currentDrawing) return;
    if (
      drawingState.tool != TOOL_DRAW &&
      drawingState.tool != TOOL_ERASE
    )
      return;

    const coords = getCanvasCoordinates(
      e,
      canvasRef,
      whiteboardRef,
    );
    if (!coords) return;

    // Convert to feet coordinates for storage
    const feetPoint = coordSystem.pixelsToFeet(coords.x, coords.y);

    // Update the current drawing's points with feet coordinates
    setCurrentDrawing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        points: [...prev.points, feetPoint],
      };
    });

    if (drawingState.tool == TOOL_ERASE) {
      // Use circular eraser
      context.save();
      context.globalCompositeOperation =
        COMPOSITE_DESTINATION_OUT;
      context.beginPath();
      context.arc(
        coords.x,
        coords.y,
        drawingState.eraseSize / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    } else {
      // Normal drawing
      context.lineTo(coords.x, coords.y);
      context.strokeStyle = drawingState.color;
      context.lineWidth = drawingState.brushSize;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
      setDrawingPath((prev) => [
        ...prev,
        { x: coords.x, y: coords.y },
      ]);
    }
  }

  function stopDrawing() {
    if (!context) return;

    // Draw line ending if applicable (arrow or T-shape)
    if (
      drawingState.tool == TOOL_DRAW &&
      drawingState.lineEnd != LINE_END_NONE &&
      drawingPath.length >= 2
    ) {
      const endPoint = drawingPath[drawingPath.length - 1];
      const angle = calculateAverageAngle(drawingPath);

      // Save context state
      context.save();

      // Clear any line dash for the endings (endings should always be solid)
      context.setLineDash([]);

      // Set style to match the line
      context.strokeStyle = drawingState.color;
      context.fillStyle = drawingState.color;
      context.lineWidth = drawingState.brushSize;
      context.lineCap = "round";
      context.lineJoin = "round";

      if (drawingState.lineEnd == LINE_END_ARROW) {
        drawArrow(
          context,
          endPoint,
          angle,
          drawingState.brushSize,
        );
      } else if (drawingState.lineEnd == LINE_END_TSHAPE) {
        drawTShape(
          context,
          endPoint,
          angle,
          drawingState.brushSize,
        );
      }

      // Restore context state
      context.restore();
    }

    setIsDrawing(false);
    context.closePath();
    // Reset to normal composite mode
    context.globalCompositeOperation = COMPOSITE_SOURCE_OVER;
    setDrawingPath([]);

    // Add both draw and erase strokes to the drawings array
    // Erase strokes need to be stored so they persist when the canvas is redrawn
    if (currentDrawing) {
      setDrawings((prev) => [...prev, currentDrawing]);
    }
    setCurrentDrawing(null);
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

  function handleMouseMove(
    e: React.MouseEvent<HTMLCanvasElement>,
  ) {
    const coords = getCanvasCoordinates(
      e,
      canvasRef,
      whiteboardRef,
    );
    if (!coords) return;

    setCursorPosition({ x: coords.x, y: coords.y });
    draw(e);
  }

  function handleMouseEnter() {
    setIsOverCanvas(true);
  }

  function handleMouseLeave() {
    setIsOverCanvas(false);
    setCursorPosition(null);
    stopDrawing();
  }

  function handleCanvasClick(
    e: React.MouseEvent<HTMLCanvasElement>,
  ) {
    if (drawingState.tool != TOOL_ADD_PLAYER) return;

    const coords = getCanvasCoordinates(
      e,
      canvasRef,
      whiteboardRef,
    );
    if (!coords) return;

    // Convert to feet coordinates for storage
    const feetCoords = coordSystem.pixelsToFeet(coords.x, coords.y);

    const newPlayer = {
      id: `player-${Date.now()}`,
      x: feetCoords.x,
      y: feetCoords.y,
      label: "",
      color: drawingState.color,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setSelectedPlayerId(newPlayer.id);
    // Pass viewport coordinates for the fixed-position dialog
    setLabelDialogPosition({ x: e.clientX, y: e.clientY });
    setShowLabelDialog(true);
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
          height: showPlayBar
            ? "calc(100vh - 302px)"
            : "calc(100vh - 122px)",
          transition: "height 800ms ease-in-out",
          overflow: "hidden",
        }}
      >
        {/* Field background fills the whiteboard and expands with it */}
        <FootballField />

        {/* Canvas and all interactive elements - as children of whiteboard */}
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{ cursor: getCursorStyle() }}
          onMouseMove={(e) => {
            // Track cursor position at container level so it updates even when over players
            const rect =
              whiteboardRef.current?.getBoundingClientRect();
            if (rect) {
              setCursorPosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
            }
          }}
          onMouseEnter={() => setIsOverCanvas(true)}
          onMouseLeave={() => {
            setIsOverCanvas(false);
            setCursorPosition(null);
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onClick={handleCanvasClick}
            className="w-full h-full absolute top-0 left-0 pointer-events-auto"
            style={{ cursor: getCursorStyle() }}
          />

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
            ref={containerRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          >
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                pointerEvents: linemanInteractable
                  ? "auto"
                  : "none",
              }}
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
          </div>

          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                pointerEvents: playerInteractable
                  ? "auto"
                  : "none",
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

// Helper function to calculate the distance from a point to a line segment
function pointToLineDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
) {
  const lineLength = Math.sqrt(
    Math.pow(lineEnd.x - lineStart.x, 2) +
      Math.pow(lineEnd.y - lineStart.y, 2),
  );

  if (lineLength == 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) +
        Math.pow(point.y - lineStart.y, 2),
    );
  }

  const t =
    ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
      (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
    Math.pow(lineLength, 2);

  const closestPoint = {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  };

  if (t < 0) {
    closestPoint.x = lineStart.x;
    closestPoint.y = lineStart.y;
  } else if (t > 1) {
    closestPoint.x = lineEnd.x;
    closestPoint.y = lineEnd.y;
  }

  return Math.sqrt(
    Math.pow(point.x - closestPoint.x, 2) +
      Math.pow(point.y - closestPoint.y, 2),
  );
}

// Helper function to determine if a point is near a drawing
function isPointNearDrawing(
  clickPixelPoint: { x: number; y: number },
  drawing: DrawingObject,
  canvasWidth: number,
  canvasHeight: number,
) {
  // Use a generous tolerance to make it easier to click on lines
  // Scale with brush size but ensure a minimum of 15 pixels
  const tolerance = Math.max(15, drawing.brushSize * 2);

  const pixelPoints = drawing.points.map((p) =>
    coordSystem.feetToPixels(p.x, p.y),
  );

  // Check each line segment in the drawing
  for (let i = 0; i < pixelPoints.length - 1; i++) {
    const p1 = pixelPoints[i];
    const p2 = pixelPoints[i + 1];

    // Calculate the distance from the click point to the line segment
    const distance = pointToLineDistance(clickPixelPoint, p1, p2);

    if (distance <= tolerance) {
      return true;
    }
  }

  return false;
}