import { useRef, useEffect, useState } from 'react';
import { useFieldCoordinates } from '../../hooks/useFieldCoordinates';
import { usePlayerDrag } from '../../hooks/usePlayerDrag';
import { LINEMAN_RADIUS } from '../../constants/field.constants';
import { eventBus } from '../../services/EventBus';

interface LinemanProps {
  id: number;
  initialX: number; // Feet coordinates
  initialY: number; // Feet coordinates
  containerWidth: number; // Container width in pixels
  containerHeight: number; // Container height in pixels
  isCenter: boolean;
  onPositionChange: (id: number, x: number, y: number) => void; // Expects feet coordinates
  onFill: (id: number) => void;
  interactable: boolean;
  currentTool?: string;
}

export function Lineman({ 
  id, 
  initialX, 
  initialY, 
  containerWidth,
  containerHeight,
  isCenter, 
  onPositionChange, 
  onFill, 
  interactable,
  currentTool
}: LinemanProps) {
  const linemanRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#3b82f6'); // All linemen default to blue

  // Coordinate system for converting between feet and pixels
  const coordSystem = useFieldCoordinates({
    containerWidth,
    containerHeight,
  });

  // Drag behavior
  const {
    isDragging,
    dragOffset,
    setIsDragging,
    setDragOffset,
    position,
    setPosition,
  } = usePlayerDrag({
    id,
    containerWidth,
    containerHeight,
    coordSystem,
    elementRef: linemanRef,
    onPositionChange,
  });

  useEffect(() => {
    setPosition({ x: initialX, y: initialY });
  }, [initialX, initialY, setPosition]);

  // Listen for fill events
  useEffect(() => {
    const handleFillEvent = (data: { id: number; color: string }) => {
      if (data.id === id) {
        setColor(data.color);
      }
    };

    eventBus.on('lineman:fill', handleFillEvent);
    return () => eventBus.off('lineman:fill', handleFillEvent);
  }, [id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if this is a click for fill tool (call onFill and don't start dragging)
    if (currentTool === 'fill') {
      onFill(id);
    } else {
      setIsDragging(true);
      
      if (linemanRef.current) {
        const rect = linemanRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left - rect.width / 2,
          y: e.clientY - rect.top - rect.height / 2,
        });
      }
    }
  };

  // Don't render if container dimensions not available
  if (!containerWidth || !containerHeight) return null;

  // Convert feet to web pixels for rendering
  const pixelPos = coordSystem.feetToPixels(position.x, position.y);
  
  // 2.0ft radius (clean 2 foot radius) - convert to pixels based on scale
  const scale = coordSystem.scale;
  const radiusInPixels = LINEMAN_RADIUS * scale;

  // Determine cursor style based on current tool
  const getCursor = () => {
    // When fill tool is active, hide cursor to show custom paint bucket cursor from Canvas
    if (currentTool === 'fill') return 'none';
    if (isDragging) return 'grabbing';
    return 'grab';
  };

  return (
    <div
      ref={linemanRef}
      onMouseDown={interactable ? handleMouseDown : undefined}
      style={{
        position: 'absolute',
        left: `${pixelPos.x}px`,
        top: `${pixelPos.y}px`,
        width: `${radiusInPixels * 2}px`,
        height: `${radiusInPixels * 2}px`,
        transform: 'translate(-50%, -50%)',
        cursor: getCursor(),
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: color,
          border: '2px solid white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );
}