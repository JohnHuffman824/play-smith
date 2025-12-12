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
const storage = new Map<string, string>()
const localStorageMock = {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => storage.set(key, value),
	removeItem: (key: string) => storage.delete(key),
	clear: () => storage.clear(),
	get length() { return storage.size },
	key: (index: number) => {
		const keys = Array.from(storage.keys())
		return keys[index] ?? null
	}
}
global.localStorage = localStorageMock as any

// Polyfill XMLSerializer for tests
global.XMLSerializer = window.XMLSerializer as any

// Polyfill getComputedStyle for Radix UI
global.getComputedStyle = window.getComputedStyle.bind(window) as any

// Polyfill MutationObserver for Radix UI
global.MutationObserver = window.MutationObserver as any

// Polyfill NodeFilter for Radix UI
global.NodeFilter = {
	SHOW_ELEMENT: 1,
	SHOW_TEXT: 4,
	SHOW_ALL: 0xFFFFFFFF,
} as any

// Polyfill HTML element types for Radix UI
global.HTMLInputElement = window.HTMLInputElement as any
global.HTMLSelectElement = window.HTMLSelectElement as any
global.HTMLTextAreaElement = window.HTMLTextAreaElement as any
global.HTMLButtonElement = window.HTMLButtonElement as any
global.HTMLElement = window.HTMLElement as any

