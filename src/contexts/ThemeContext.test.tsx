import { describe, test, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'
import { act } from 'react'

// Mock localStorage
const localStorageMock = {
	getItem: () => null,
	setItem: () => {},
	removeItem: () => {},
	clear: () => {}
}
global.localStorage = localStorageMock as Storage

function TestComponent() {
	const {
		theme,
		setTheme,
		positionNaming,
		setPositionNaming,
		fieldLevel,
		setFieldLevel
	} = useTheme()

	return (
		<div>
			<div data-testid="theme">{theme}</div>
			<div data-testid="position-naming">{positionNaming}</div>
			<div data-testid="field-level">{fieldLevel}</div>
			<button onClick={() => setTheme('dark')}>Set Dark</button>
			<button onClick={() => setPositionNaming('modern')}>Set Modern</button>
			<button onClick={() => setFieldLevel('college')}>Set College</button>
		</div>
	)
}

describe('ThemeContext', () => {
	test('provides default values', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		expect(screen.getByTestId('theme').textContent).toBe('light')
		expect(screen.getByTestId('position-naming').textContent).toBe('traditional')
		expect(screen.getByTestId('field-level').textContent).toBe('college')
	})

	test('allows updating theme', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		act(() => {
			screen.getByText('Set Dark').click()
		})

		expect(screen.getByTestId('theme').textContent).toBe('dark')
	})

	test('allows updating position naming', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		act(() => {
			screen.getByText('Set Modern').click()
		})

		expect(screen.getByTestId('position-naming').textContent).toBe('modern')
	})

	test('allows updating field level', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>
		)

		act(() => {
			screen.getByText('Set College').click()
		})

		expect(screen.getByTestId('field-level').textContent).toBe('college')
	})
})
