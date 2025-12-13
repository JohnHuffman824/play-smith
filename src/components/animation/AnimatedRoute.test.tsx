import { describe, test, expect, afterEach } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { AnimatedRoute } from './AnimatedRoute'
import { FieldCoordinateSystem } from '../../utils/coordinates'
import { SettingsProvider } from '../../contexts/SettingsContext'
import type { Drawing } from '../../types/drawing.types'

describe('AnimatedRoute - Smooth Rendering', () => {
	afterEach(() => {
		cleanup()
	})

	test('sharp drawings render with angular paths', () => {
		const coordSystem = new FieldCoordinateSystem(1600, 800)

		const sharpDrawing: Drawing = {
			id: 'test-sharp',
			points: {
				p1: { id: 'p1', x: 10, y: 10, type: 'start' },
				p2: { id: 'p2', x: 20, y: 10, type: 'corner' },
				p3: { id: 'p3', x: 30, y: 20, type: 'end' },
			},
			segments: [
				{ type: 'line', pointIds: ['p1', 'p2'] },
				{ type: 'line', pointIds: ['p2', 'p3'] },
			],
			style: {
				color: '#FF0000',
				strokeWidth: 0.3,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'sharp', // Sharp mode
			},
			annotations: [],
		}

		const { container } = render(
			<SettingsProvider>
				<svg>
					<AnimatedRoute
						drawing={sharpDrawing}
						coordSystem={coordSystem}
						progress={0}
						showProgress={false}
					/>
				</svg>
			</SettingsProvider>
		)

		const paths = container.querySelectorAll('path')
		expect(paths.length).toBeGreaterThan(0)

		const pathData = paths[0]?.getAttribute('d') || ''

		// Sharp path should have exactly 3 points (M, L, L)
		// No smoothing means it follows control points directly
		expect(pathData).toMatch(/^M \d+\.?\d* \d+\.?\d* L \d+\.?\d* \d+\.?\d* L \d+\.?\d* \d+\.?\d*$/)
	})

	test('smooth drawings apply Chaikin smoothing', () => {
		const coordSystem = new FieldCoordinateSystem(1600, 800)

		const smoothDrawing: Drawing = {
			id: 'test-smooth',
			points: {
				p1: { id: 'p1', x: 10, y: 10, type: 'start' },
				p2: { id: 'p2', x: 20, y: 10, type: 'corner' },
				p3: { id: 'p3', x: 30, y: 20, type: 'end' },
			},
			segments: [
				{ type: 'line', pointIds: ['p1', 'p2'] },
				{ type: 'line', pointIds: ['p2', 'p3'] },
			],
			style: {
				color: '#FF0000',
				strokeWidth: 0.3,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'curve', // Smooth mode
			},
			annotations: [],
		}

		const { container } = render(
			<SettingsProvider>
				<svg>
					<AnimatedRoute
						drawing={smoothDrawing}
						coordSystem={coordSystem}
						progress={0}
						showProgress={false}
					/>
				</svg>
			</SettingsProvider>
		)

		const paths = container.querySelectorAll('path')
		expect(paths.length).toBeGreaterThan(0)

		const pathData = paths[0]?.getAttribute('d') || ''

		// Smooth path should have MANY more points due to Chaikin subdivision
		// After 3 iterations, 3 points become many smoothed points
		// Count the number of L commands (should be much more than 2)
		const lineCommands = (pathData.match(/L/g) || []).length

		// With Chaikin (3 iterations), 3 points should produce significantly more points
		// With endpoint preservation, we get fewer intermediate points but still much more than sharp
		expect(lineCommands).toBeGreaterThan(6)
	})

	test('cubic and quadratic segments are not smoothed', () => {
		const coordSystem = new FieldCoordinateSystem(1600, 800)

		const curveDrawing: Drawing = {
			id: 'test-cubic',
			points: {
				p1: { id: 'p1', x: 10, y: 10, type: 'start' },
				p2: { id: 'p2', x: 15, y: 15, type: 'corner' },
				p3: { id: 'p3', x: 20, y: 15, type: 'corner' },
				p4: { id: 'p4', x: 30, y: 20, type: 'end' },
			},
			segments: [
				{ type: 'cubic', pointIds: ['p1', 'p2', 'p3', 'p4'] },
			],
			style: {
				color: '#FF0000',
				strokeWidth: 0.3,
				lineStyle: 'solid',
				lineEnd: 'none',
				pathMode: 'curve', // Even though it's curve mode, cubic segments aren't smoothed
			},
			annotations: [],
		}

		const { container } = render(
			<SettingsProvider>
				<svg>
					<AnimatedRoute
						drawing={curveDrawing}
						coordSystem={coordSystem}
						progress={0}
						showProgress={false}
					/>
				</svg>
			</SettingsProvider>
		)

		const paths = container.querySelectorAll('path')
		const pathData = paths[0]?.getAttribute('d') || ''

		// Should contain a cubic curve command (C)
		expect(pathData).toContain('C')
		// Should not have many L commands (no Chaikin smoothing)
		const lineCommands = (pathData.match(/L/g) || []).length
		expect(lineCommands).toBe(0)
	})
})
