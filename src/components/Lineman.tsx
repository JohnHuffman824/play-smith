import { useState, useRef, useEffect } from 'react';
import { useFieldCoordinates } from '../hooks/useFieldCoordinates';
import { LINEMAN_RADIUS, EVENT_FILL_LINEMAN } from '../constants/field.constants';

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
  const [position, setPosition] = useState({ x: initialX, y: initialY }); // Store in feet
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#3b82f6'); // All linemen default to blue
  const linemanRef = useRef<HTMLDivElement>(null);

  // Coordinate system for converting between feet and pixels
  const coordSystem = useFieldCoordinates({
    containerWidth,
    containerHeight,
  });

  useEffect(() => {
    setPosition({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  // Listen for fill events
  useEffect(() => {
    const handleFillEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.id === id) {
        setColor(customEvent.detail.color);
      }
    };

    window.addEventListener(EVENT_FILL_LINEMAN, handleFillEvent);
    return () => window.removeEventListener(EVENT_FILL_LINEMAN, handleFillEvent);
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !linemanRef.current || !containerWidth || !containerHeight) return;

      const parent = linemanRef.current.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - dragOffset.x;
      const newY = e.clientY - parentRect.top - dragOffset.y;

      // Convert to feet coordinates
      const feetCoords = coordSystem.pixelsToFeet(newX, newY);
      setPosition({ x: feetCoords.x, y: feetCoords.y });
      onPositionChange(id, feetCoords.x, feetCoords.y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, onPositionChange, containerWidth, containerHeight]);

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
        // Add smooth transition when not dragging (for play bar animation)
        transition: isDragging ? 'none' : 'left 800ms ease-in-out, top 800ms ease-in-out, width 800ms ease-in-out, height 800ms ease-in-out',
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