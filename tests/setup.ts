import { Window } from 'happy-dom'

const window = new Window()
const document = window.document

global.window = window as any
global.document = document as any
global.navigator = window.navigator as any

// Configure React Testing Library environment to suppress act() warnings
;(global as any).IS_REACT_ACT_ENVIRONMENT = true

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

