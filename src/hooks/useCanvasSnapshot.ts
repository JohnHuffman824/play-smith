export interface CanvasSnapshot {
	dataUrl: string
	width: number
	height: number
}

export function captureCanvasSnapshot(
	container: HTMLElement | null
): CanvasSnapshot | null {
	if (!container) return null

	const svg = container.querySelector('svg')
	if (!svg) return null

	const clone = svg.cloneNode(true) as SVGSVGElement
	const serializer = new XMLSerializer()
	const svgString = serializer.serializeToString(clone)
	const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`

	const rect = container.getBoundingClientRect()

	return {
		dataUrl,
		width: rect.width,
		height: rect.height,
	}
}
