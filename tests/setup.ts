import { Window } from 'happy-dom'

const window = new Window()
const document = window.document

global.window = window as any
global.document = document as any
global.navigator = window.navigator as any

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

