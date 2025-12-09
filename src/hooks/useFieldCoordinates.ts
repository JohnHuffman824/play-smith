/**
* Hook to provide field coordinate system with automatic dimension updates
*/

import { useMemo } from 'react'
import {
	FieldCoordinateSystem,
	createCoordinateSystem,
} from '../utils/coordinates'

interface UseFieldCoordinatesOptions {
	containerWidth: number
	containerHeight: number
}

/**
* Hook that provides a FieldCoordinateSystem instance
* Creates a new instance when container dimensions change
*/
export function useFieldCoordinates({
	containerWidth,
	containerHeight,
}: UseFieldCoordinatesOptions): FieldCoordinateSystem {
	return useMemo(() => {
		return createCoordinateSystem(containerWidth, containerHeight)
	}, [containerWidth, containerHeight])
}

