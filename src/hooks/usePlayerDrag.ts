/**
 * Hook to handle dragging logic for players and linemen
 * Eliminates duplicated drag code between Player and Lineman components
 */

import { useState, useEffect, useRef, RefObject } from 'react'
import { FieldCoordinateSystem } from '../utils/coordinates'
import { applyLOSSnap } from '../utils/los-snap.utils'

interface UsePlayerDragOptions<T extends string | number> {
	id: T
	containerWidth: number
	containerHeight: number
	coordSystem: FieldCoordinateSystem
	elementRef: RefObject<HTMLDivElement>
	onPositionChange: (id: T, x: number, y: number) => void
	zoom?: number
	panX?: number
	panY?: number
}

interface UsePlayerDragReturn {
	isDragging: boolean
	dragOffset: { x: number; y: number }
	setIsDragging: (dragging: boolean) => void
	setDragOffset: (offset: { x: number; y: number }) => void
	position: { x: number; y: number }
	setPosition: (position: { x: number; y: number }) => void
}

/**
 * Hook that manages dragging behavior for players and linemen
 * Handles mouse events, coordinate conversion, and position updates
 */
export function usePlayerDrag<T extends string | number>({
	id,
	containerWidth,
	containerHeight,
	coordSystem,
	elementRef,
	onPositionChange,
	zoom = 1,
	panX = 0,
	panY = 0,
}: UsePlayerDragOptions<T>): UsePlayerDragReturn {
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const positionRef = useRef(position)

	// Keep ref in sync with position state
	useEffect(() => {
		positionRef.current = position
	}, [position])

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isDragging || !elementRef.current || !containerWidth || !containerHeight) return

			const parent = elementRef.current.parentElement
			if (!parent) return

			const parentRect = parent.getBoundingClientRect()
			const screenX = e.clientX - parentRect.left - dragOffset.x
			const screenY = e.clientY - parentRect.top - dragOffset.y

			// Convert to feet coordinates accounting for zoom/pan
			const feetCoords = coordSystem.screenToFeet(screenX, screenY, zoom, panX, panY)
			setPosition({ x: feetCoords.x, y: feetCoords.y })
			onPositionChange(id, feetCoords.x, feetCoords.y)
		}

		const handleMouseUp = () => {
			// Apply LOS snap on release
			const currentPos = positionRef.current
			const snapped = applyLOSSnap(currentPos.x, currentPos.y)
			if (snapped.snapped) {
				setPosition({ x: snapped.x, y: snapped.y })
				onPositionChange(id, snapped.x, snapped.y)
			}
			setIsDragging(false)
		}

		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isDragging, dragOffset, id, onPositionChange, containerWidth, containerHeight, coordSystem, elementRef, zoom, panX, panY])

	return {
		isDragging,
		dragOffset,
		setIsDragging,
		setDragOffset,
		position,
		setPosition,
	}
}
