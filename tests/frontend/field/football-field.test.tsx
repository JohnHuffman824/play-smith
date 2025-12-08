import { test, expect } from 'bun:test'
import React from 'react'
import { render } from '@testing-library/react'
import { FieldContainer } from '../../../src/components/field/FieldContainer'

test('FieldContainer renders football field SVG', () => {
	const { container } = render(<FieldContainer />)
	const svg = container.querySelector('svg')

	expect(svg).toBeTruthy()
	expect(svg?.style.backgroundColor).toBe('#f2f2f2')
})

test('FieldContainer renders hash marks', () => {
	const { container } = render(<FieldContainer />)
	const lines = container.querySelectorAll('line')

	// Should have yard lines, hash marks, and sidelines
	expect(lines.length).toBeGreaterThan(0)
})

