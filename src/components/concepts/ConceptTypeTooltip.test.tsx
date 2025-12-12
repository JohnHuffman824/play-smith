import { test, expect, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import { ConceptTypeTooltip } from './ConceptTypeTooltip'
import userEvent from '@testing-library/user-event'

afterEach(() => {
	cleanup()
})

test('ConceptTypeTooltip renders help icon', () => {
	render(<ConceptTypeTooltip />)
	const button = screen.getByLabelText('Concept type help')
	expect(button).toBeTruthy()
})

test('ConceptTypeTooltip shows tooltip on click', async () => {
	const user = userEvent.setup()
	render(<ConceptTypeTooltip />)

	const button = screen.getByLabelText('Concept type help')
	await user.click(button)

	// Check that tooltip content is visible
	expect(screen.getByText('Concept Types')).toBeTruthy()
	expect(screen.getByText('Motion')).toBeTruthy()
	expect(screen.getByText('Modifier')).toBeTruthy()
})

test('ConceptTypeTooltip displays Motion description', async () => {
	const user = userEvent.setup()
	render(<ConceptTypeTooltip />)

	const button = screen.getByLabelText('Concept type help')
	await user.click(button)

	expect(
		screen.getByText(/Pre-snap player movement that occurs before the ball is snapped/)
	).toBeTruthy()
	expect(screen.getByText(/Examples: Jet, Orbit, Return/)).toBeTruthy()
})

test('ConceptTypeTooltip displays Modifier description', async () => {
	const user = userEvent.setup()
	render(<ConceptTypeTooltip />)

	const button = screen.getByLabelText('Concept type help')
	await user.click(button)

	expect(
		screen.getByText(/Adjusts player positions within an existing formation/)
	).toBeTruthy()
	expect(screen.getByText(/Examples: Tight, Nasty, Wide/)).toBeTruthy()
})

test('ConceptTypeTooltip hides tooltip on outside click', async () => {
	const user = userEvent.setup()
	const { container } = render(<ConceptTypeTooltip />)

	const button = screen.getByLabelText('Concept type help')
	await user.click(button)

	// Tooltip should be visible
	expect(screen.getByText('Concept Types')).toBeTruthy()

	// Click outside
	await user.click(container)

	// Tooltip should be hidden
	expect(screen.queryByText('Concept Types')).toBeFalsy()
})
