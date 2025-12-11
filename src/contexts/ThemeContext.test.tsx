import { describe, test, expect, beforeEach, vi } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'
import { act } from 'react'

// Mock localStorage
const createLocalStorageMock = () => ({
	getItem: vi.fn((key: string) => null),
	setItem: vi.fn((key: string, value: string) => {}),
	removeItem: vi.fn((key: string) => {}),
	clear: vi.fn(() => {}),
	length: 0,
	key: vi.fn((index: number) => null)
})

// Create initial mock
let localStorageMock = createLocalStorageMock()
Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true,
	configurable: true
})

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
	beforeEach(() => {
		// Clean up rendered components from previous tests
		cleanup()

		// Clean up document state between tests
		document.documentElement.classList.remove('dark')

		// Reset localStorage mock
		localStorageMock = createLocalStorageMock()
		Object.defineProperty(global, 'localStorage', {
			value: localStorageMock,
			writable: true,
			configurable: true
		})
	})

	test('provides default values', () => {
		act(() => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			)
		})

		expect(screen.getByTestId('theme').textContent).toBe('light')
		expect(screen.getByTestId('position-naming').textContent).toBe('traditional')
		expect(screen.getByTestId('field-level').textContent).toBe('college')
	})

	test('allows updating theme', () => {
		act(() => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			)
		})

		act(() => {
			screen.getByText('Set Dark').click()
		})

		expect(screen.getByTestId('theme').textContent).toBe('dark')
	})

	test('allows updating position naming', () => {
		act(() => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			)
		})

		act(() => {
			screen.getByText('Set Modern').click()
		})

		expect(screen.getByTestId('position-naming').textContent).toBe('modern')
	})

	test('allows updating field level', () => {
		act(() => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			)
		})

		act(() => {
			screen.getByText('Set College').click()
		})

		expect(screen.getByTestId('field-level').textContent).toBe('college')
	})

	test('persists theme to localStorage', () => {
		act(() => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			)
		})

		act(() => {
			screen.getByText('Set Dark').click()
		})

		expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', '"dark"')
	})

	test('loads initial values from localStorage', () => {
		localStorageMock.getItem = vi.fn((key: string) => {
			if (key === 'theme') return '"dark"'
			if (key === 'positionNaming') return '"modern"'
			if (key === 'fieldLevel') return '"pro"'
			return null
		})

		act(() => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			)
		})

		expect(screen.getByTestId('theme').textContent).toBe('dark')
		expect(screen.getByTestId('position-naming').textContent).toBe('modern')
		expect(screen.getByTestId('field-level').textContent).toBe('pro')
	})

	test('applies dark class to document element', () => {
		act(() => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			)
		})

		expect(document.documentElement.classList.contains('dark')).toBe(false)

		act(() => {
			screen.getByText('Set Dark').click()
		})

		expect(document.documentElement.classList.contains('dark')).toBe(true)
	})
})
