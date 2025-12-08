/**
 * Football field coordinate system utility
 * 
 * Handles conversion between two coordinate systems:
 * 1. FEET COORDINATES (Storage/Logic)
 *    - Origin: Bottom-left (0, 0)
 *    - Y-axis: Increases upward (natural)
 *    - Width: 160 feet
 * 
 * 2. WEB PIXEL COORDINATES (Rendering)
 *    - Origin: Top-left (0, 0)
 *    - Y-axis: Increases downward (CSS/Canvas default)
 *    - Width: Dynamic (responsive)
 */

import { FIELD_WIDTH_FEET } from '../constants/field.constants'
import { Coordinate, FeetCoordinate, PixelCoordinate } from '../types/field.types'

export class FieldCoordinateSystem {
	private containerWidth: number
	private containerHeight: number

	constructor(containerWidth: number, containerHeight: number) {
		this.containerWidth = containerWidth
		this.containerHeight = containerHeight
	}

	/**
	 * Get the current scale factor (pixels per foot)
	 */
	get scale(): number {
		return this.containerWidth / FIELD_WIDTH_FEET
	}

	/**
	 * Convert feet coordinates to web pixel coordinates
	 * Handles Y-axis flip: feet Y=0 is at bottom, pixel Y=0 is at top
	 */
	feetToPixels(feetX: number, feetY: number): PixelCoordinate {
		const pixelX = feetX * this.scale
		const pixelY = this.containerHeight - feetY * this.scale
		return { x: pixelX, y: pixelY }
	}

	/**
	 * Convert web pixel coordinates to feet coordinates
	 * Handles Y-axis flip: pixel Y=0 is at top, feet Y=0 is at bottom
	 */
	pixelsToFeet(pixelX: number, pixelY: number): FeetCoordinate {
		const feetX = pixelX / this.scale
		const feetY = (this.containerHeight - pixelY) / this.scale
		return { x: feetX, y: feetY }
	}

	/**
	 * Update container dimensions (e.g., when window resizes)
	 */
	updateDimensions(width: number, height: number): void {
		this.containerWidth = width
		this.containerHeight = height
	}

	/**
	 * Get current container dimensions
	 */
	getDimensions(): { width: number; height: number } {
		return {
			width: this.containerWidth,
			height: this.containerHeight,
		}
	}

	/**
	 * Calculate the height in feet based on current container height
	 */
	getHeightInFeet(): number {
		return this.containerHeight / this.scale
	}
}

/**
 * Helper function to create a coordinate system instance
 */
export function createCoordinateSystem(
	containerWidth: number,
	containerHeight: number
): FieldCoordinateSystem {
	return new FieldCoordinateSystem(containerWidth, containerHeight)
}
