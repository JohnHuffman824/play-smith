/**
 * Utility functions for generating thumbnails from canvas/SVG elements
 *
 * Thumbnails are 200x150px PNG images encoded as base64 data URLs
 */

export const THUMBNAIL_WIDTH = 200
export const THUMBNAIL_HEIGHT = 150

/**
 * Generate a thumbnail from an SVG element
 *
 * @param svgElement - The SVG element to capture
 * @param width - Target thumbnail width (default: 200)
 * @param height - Target thumbnail height (default: 150)
 * @returns Base64-encoded PNG data URL
 *
 * @example
 * ```typescript
 * const svg = document.querySelector('svg')
 * const thumbnail = await generateThumbnailFromSVG(svg)
 * // thumbnail = 'data:image/png;base64,iVBORw0KGgo...'
 * ```
 */
export async function generateThumbnailFromSVG(
	svgElement: SVGSVGElement,
	width: number = THUMBNAIL_WIDTH,
	height: number = THUMBNAIL_HEIGHT
): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			// Get SVG source
			const svgData = new XMLSerializer().serializeToString(svgElement)
			const svgBlob = new Blob([svgData], {
				type: 'image/svg+xml;charset=utf-8'
			})
			const url = URL.createObjectURL(svgBlob)

			// Create image from SVG
			const img = new Image()
			img.onload = () => {
				// Create canvas for thumbnail
				const canvas = document.createElement('canvas')
				canvas.width = width
				canvas.height = height
				const ctx = canvas.getContext('2d')

				if (!ctx) {
					reject(new Error('Failed to get canvas context'))
					return
				}

				// Fill with white background
				ctx.fillStyle = '#ffffff'
				ctx.fillRect(0, 0, width, height)

				// Calculate scaling to fit while maintaining aspect ratio
				const svgWidth = svgElement.viewBox.baseVal.width || svgElement.width.baseVal.value
				const svgHeight = svgElement.viewBox.baseVal.height || svgElement.height.baseVal.value

				const scale = Math.min(width / svgWidth, height / svgHeight)
				const scaledWidth = svgWidth * scale
				const scaledHeight = svgHeight * scale

				// Center the image
				const x = (width - scaledWidth) / 2
				const y = (height - scaledHeight) / 2

				// Draw scaled image
				ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

				// Convert to data URL
				const dataUrl = canvas.toDataURL('image/png')

				// Cleanup
				URL.revokeObjectURL(url)

				resolve(dataUrl)
			}

			img.onerror = () => {
				URL.revokeObjectURL(url)
				reject(new Error('Failed to load SVG as image'))
			}

			img.src = url
		} catch (error) {
			reject(error)
		}
	})
}

/**
 * Generate a thumbnail from a canvas element
 *
 * @param canvas - The HTML canvas element to capture
 * @param width - Target thumbnail width (default: 200)
 * @param height - Target thumbnail height (default: 150)
 * @returns Base64-encoded PNG data URL
 *
 * @example
 * ```typescript
 * const canvas = document.querySelector('canvas')
 * const thumbnail = generateThumbnailFromCanvas(canvas)
 * ```
 */
export function generateThumbnailFromCanvas(
	canvas: HTMLCanvasElement,
	width: number = THUMBNAIL_WIDTH,
	height: number = THUMBNAIL_HEIGHT
): string {
	// Create thumbnail canvas
	const thumbnailCanvas = document.createElement('canvas')
	thumbnailCanvas.width = width
	thumbnailCanvas.height = height
	const ctx = thumbnailCanvas.getContext('2d')

	if (!ctx) {
		throw new Error('Failed to get canvas context')
	}

	// Fill with white background
	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, width, height)

	// Calculate scaling
	const scale = Math.min(width / canvas.width, height / canvas.height)
	const scaledWidth = canvas.width * scale
	const scaledHeight = canvas.height * scale

	// Center the image
	const x = (width - scaledWidth) / 2
	const y = (height - scaledHeight) / 2

	// Draw scaled image
	ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight)

	// Convert to data URL
	return thumbnailCanvas.toDataURL('image/png')
}

/**
 * Generate a thumbnail from a DOM element containing a canvas or SVG
 *
 * @param element - The container element (will search for canvas or svg inside)
 * @param width - Target thumbnail width (default: 200)
 * @param height - Target thumbnail height (default: 150)
 * @returns Base64-encoded PNG data URL, or null if no canvas/svg found
 *
 * @example
 * ```typescript
 * const container = document.querySelector('.canvas-container')
 * const thumbnail = await generateThumbnail(container)
 * ```
 */
export async function generateThumbnail(
	element: HTMLElement,
	width: number = THUMBNAIL_WIDTH,
	height: number = THUMBNAIL_HEIGHT
): Promise<string | null> {
	// Try to find SVG first
	const svg = element.querySelector('svg')
	if (svg) {
		return generateThumbnailFromSVG(svg, width, height)
	}

	// Try to find canvas
	const canvas = element.querySelector('canvas')
	if (canvas) {
		return generateThumbnailFromCanvas(canvas, width, height)
	}

	return null
}

/**
 * Validate a thumbnail data URL
 *
 * @param dataUrl - The data URL to validate
 * @returns True if valid PNG data URL
 */
export function isValidThumbnail(dataUrl: string): boolean {
	return dataUrl.startsWith('data:image/png;base64,')
}

/**
 * Get the size of a thumbnail in bytes
 *
 * @param dataUrl - The data URL
 * @returns Size in bytes
 */
export function getThumbnailSize(dataUrl: string): number {
	// Remove data URL prefix
	const base64 = dataUrl.split(',')[1]
	if (!base64) return 0

	// Calculate size (base64 is ~4/3 the size of original)
	return Math.ceil((base64.length * 3) / 4)
}
