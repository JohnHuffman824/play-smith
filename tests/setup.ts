import { Window } from 'happy-dom'

const window = new Window()
const document = window.document

global.window = window as any
global.document = document as any
global.navigator = window.navigator as any

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
} as any

