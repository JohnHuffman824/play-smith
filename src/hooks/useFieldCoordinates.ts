/**
 * Hook to provide field coordinate system with automatic dimension updates
 */

import { useEffect, useMemo, useRef } from 'react'
import { FieldCoordinateSystem, createCoordinateSystem } from '../utils/coordinates'

interface UseFieldCoordinatesOptions {
	containerWidth: number
	containerHeight: number
}

/**
 * Hook that provides a FieldCoordinateSystem instance
 * Automatically updates when container dimensions change
 */
export function useFieldCoordinates({
	containerWidth,
	containerHeight,
}: UseFieldCoordinatesOptions): FieldCoordinateSystem {
	const coordSystemRef = useRef<FieldCoordinateSystem | null>(null)

	// Initialize coordinate system on first render
	if (!coordSystemRef.current) {
		coordSystemRef.current = createCoordinateSystem(containerWidth, containerHeight)
	}

	// Update dimensions when they change
	useEffect(() => {
		if (coordSystemRef.current) {
			coordSystemRef.current.updateDimensions(containerWidth, containerHeight)
		}
	}, [containerWidth, containerHeight])

	return coordSystemRef.current
}
