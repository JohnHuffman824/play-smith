import { Window } from 'happy-dom'

const window = new Window()
const document = window.document

global.window = window as any
global.document = document as any
global.navigator = window.navigator as any

// Configure React Testing Library environment to suppress act() warnings
;(global as any).IS_REACT_ACT_ENVIRONMENT = true

// Suppress act() warnings and expected SQLite errors in console
const originalError = console.error
console.error = (...args: any[]) => {
	const message = args[0]
	// Suppress act() warnings
	if (typeof message === 'string' && message.includes('not wrapped in act(...)')) {
		return
	}
	// Suppress SQLite query errors in tests (expected errors for constraint testing)
	if (typeof message === 'string' && message.includes('SQLite query error:')) {
		return
	}
	// Suppress query/params logging from database layer
	if (typeof message === 'string' && (message.includes('Query:') || message.includes('Params:'))) {
		return
	}
	// Suppress expected error messages from components in tests
	if (typeof message === 'string' && (
		message.includes('Failed to load play') ||
		message.includes('Play update error')
	)) {
		return
	}
	originalError(...args)
}

// Polyfill ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
} as any

// Polyfill KeyboardEvent for tests
global.KeyboardEvent = window.KeyboardEvent as any

// Polyfill MouseEvent for tests
global.MouseEvent = window.MouseEvent as any

// Polyfill DocumentFragment for tests
global.DocumentFragment = window.DocumentFragment as any

// Polyfill localStorage for tests
const localStorageMock = {
	getItem: (key: string) => null,
	setItem: (key: string, value: string) => {},
	removeItem: (key: string) => {},
	clear: () => {},
	length: 0,
	key: (index: number) => null
}
global.localStorage = localStorageMock as any

