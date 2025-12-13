import { describe, test, expect, afterEach } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { PlayThumbnailSVG } from './PlayThumbnailSVG'
import type { Drawing } from '@/types/drawing.types'
import { SettingsProvider } from '@/contexts/SettingsContext'

describe('PlayThumbnailSVG - Rendering Order', () => {
	afterEach(() => {
		cleanup()
	})

	test('renders players on top of drawings (players after drawings in DOM)', () => {
		const drawing: Drawing = {
			id: 'drawing-1',
			points: {
				p1: { id: 'p1', x: 80, y: 45, type: 'start' },
				p2: { id: 'p2', x: 100, y: 45, type: 'end' },
			},
			playerId: 'player-1', // linked to player
			linkedPointId: 'p1',
			segments: [{ type: 'line', pointIds: ['p1', 'p2'] }],
			style: { color: '#ff0000', strokeWidth: 2, lineStyle: 'solid', lineEnd: 'none', pathMode: 'sharp' },
			annotations: [],
		}

		const player = {
			id: 'player-1',
			x: 80,
			y: 45,
			label: 'QB',
			color: '#0000ff',
		}

		const { container } = render(
			<SettingsProvider>
				<PlayThumbnailSVG drawings={[drawing]} players={[player]} />
			</SettingsProvider>
		)

		const svg = container.querySelector('svg')
		const children = svg ? Array.from(svg.children) : []

		// Find indices of player circle and drawing path
		let playerIndex = -1
		let drawingIndex = -1

		children.forEach((child, index) => {
			if (child.tagName === 'circle' && child.getAttribute('fill') === '#0000ff') {
				playerIndex = index
			}
			if (child.tagName === 'g') {
				// Drawing is wrapped in a <g> element
				drawingIndex = index
			}
		})

		// Players should be rendered AFTER drawings (higher index = on top in SVG)
		expect(playerIndex).toBeGreaterThan(drawingIndex)
	})
})
