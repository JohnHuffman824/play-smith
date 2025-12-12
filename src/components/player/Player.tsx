import { useRef, useEffect, useState } from 'react'
import { useFieldCoordinates, usePlayerDrag } from '@/hooks'
import { PLAYER_RADIUS_FEET } from '@/constants'
import { eventBus } from '@/services'
import { useTheme } from '@/contexts/SettingsContext'

/**
 * Calculate the luminance of a color to determine if text should be black or white
 * Uses WCAG relative luminance formula for accessibility
 */
function getTextColorForBackground(hexColor: string): string {
	// Remove # if present
	const hex = hexColor.replace('#', '')

	// Parse RGB values
	const r = parseInt(hex.substring(0, 2), 16) / 255
	const g = parseInt(hex.substring(2, 4), 16) / 255
	const b = parseInt(hex.substring(4, 6), 16) / 255

	// Apply gamma correction (WCAG formula)
	const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
	const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
	const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

	// Calculate relative luminance
	const luminance = 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB

	// If luminance > 0.5, background is light, use black text
	// Otherwise use white text
	return luminance > 0.5 ? 'black' : 'white'
}

interface PlayerProps {
  id: string
  initialX: number // Feet coordinates
  initialY: number // Feet coordinates
  containerWidth: number // Container width in pixels
  containerHeight: number // Container height in pixels
  label: string
  onPositionChange: (id: string, x: number, y: number) => void // Expects feet coordinates
  onLabelClick: (id: string, x: number, y: number) => void
  onFill: (id: string) => void
  onDelete?: (id: string) => void
  interactable: boolean
  currentTool?: string
  color?: string
  onHoverChange?: (isHovered: boolean) => void
}

export function Player({
  id,
  initialX,
  initialY,
  containerWidth,
  containerHeight,
  label,
  onPositionChange,
  onLabelClick,
  onFill,
  onDelete,
  interactable,
  currentTool,
  color = '#3b82f6',
  onHoverChange,
  zoom,
  panX,
  panY,
}: PlayerProps) {
  const { theme } = useTheme()
  const playerRef = useRef<HTMLDivElement>(null)
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)
  const [fillColor, setFillColor] = useState(color)
  const [isHovered, setIsHovered] = useState(false)

  const DRAG_THRESHOLD = 5 // pixels

  // Coordinate system for converting between feet and pixels
  const coordSystem = useFieldCoordinates({
    containerWidth,
    containerHeight,
  })

  // Drag behavior
  const {
    isDragging,
    setIsDragging,
    setDragOffset,
    position,
    setPosition,
  } = usePlayerDrag({
    id,
    containerWidth,
    containerHeight,
    coordSystem,
    elementRef: playerRef,
    onPositionChange,
    zoom,
    panX,
    panY,
  })

  useEffect(() => {
    setPosition({ x: initialX, y: initialY })
  }, [initialX, initialY, setPosition])

  // Listen for fill events
  useEffect(() => {
    const handleFillEvent = (data: { id: string; color: string }) => {
      if (data.id === id) {
        setFillColor(data.color)
      }
    }

    eventBus.on('player:fill', handleFillEvent)
    return () => eventBus.off('player:fill', handleFillEvent)
  }, [id])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY }

    // If erase tool is active, delete the player instead of dragging
    if (currentTool === 'erase' && onDelete) {
      onDelete(id)
      return
    }

    // Check if this is a click for fill tool (call onFill and don't start dragging)
    onFill(id)

    setIsDragging(true)

    if (playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      })
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // If erase tool is active, the deletion already happened in mouseDown
    if (currentTool === 'erase') {
      return
    }

    // Check if this was a drag (moved more than threshold)
    if (mouseDownPosRef.current) {
      const dx = e.clientX - mouseDownPosRef.current.x
      const dy = e.clientY - mouseDownPosRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > DRAG_THRESHOLD) {
        mouseDownPosRef.current = null
        return // Was a drag, don't open dialog
      }
    }
    mouseDownPosRef.current = null

    if (!isDragging && playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect()
      // Pass viewport coordinates (center of the player circle)
      const viewportX = rect.left + rect.width / 2
      const viewportY = rect.top + rect.height / 2
      onLabelClick(id, viewportX, viewportY)
    }
  }

  // Don't render if container dimensions not available
  if (!containerWidth || !containerHeight) return null

  // Convert feet to web pixels for rendering
  const pixelPos = coordSystem.feetToPixels(position.x, position.y)
  
  // 2.0ft radius (clean 2 foot radius) - convert to pixels based on scale
  const scale = coordSystem.scale
  const radiusInPixels = PLAYER_RADIUS_FEET * scale

  // Determine cursor style based on current tool
  const getCursor = () => {
    // When erase tool is active and hovering, show trash cursor
    if (currentTool === 'erase' && isHovered) {
      return 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="rgb(239, 68, 68)" stroke="rgb(255, 255, 255)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>\') 12 12, pointer'
    }
    // When erase tool is active but not hovering, hide cursor (show circular cursor from Canvas)
    if (currentTool === 'erase') return 'none'
    // When fill tool is active, hide cursor to show custom paint bucket cursor from Canvas
    if (currentTool === 'fill') return 'none'
    if (isDragging) return 'grabbing'
    return 'grab'
  }

  // Calculate text color based on background color for visibility
  const textColor = getTextColorForBackground(fillColor)

  // Player outline color: black in light mode, white in dark mode
  const outlineColor = theme === 'dark' ? 'white' : 'black'

  return (
    <div
      ref={playerRef}
      onMouseDown={interactable ? handleMouseDown : undefined}
      onClick={interactable ? handleClick : undefined}
      onMouseEnter={() => {
        setIsHovered(true)
        if (onHoverChange) onHoverChange(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        if (onHoverChange) onHoverChange(false)
      }}
      style={{
        position: 'absolute',
        pointerEvents: interactable ? 'auto' : 'none',
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
          backgroundColor: fillColor,
          border: `2px solid ${outlineColor}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: textColor,
          fontWeight: 'bold',
          fontSize: `${radiusInPixels}px`,
          fontFamily: 'SF Compact Rounded, system-ui, sans-serif',
          userSelect: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  )
}