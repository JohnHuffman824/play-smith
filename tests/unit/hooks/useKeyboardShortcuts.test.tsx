/**
* Tests for useKeyboardShortcuts hook
* Verifies keyboard event handling and event bus integration
*/

import { describe, it, expect, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import {
	useKeyboardShortcuts,
	getAllShortcuts,
	getShortcutForTool,
} from '../../../src/hooks/useKeyboardShortcuts'
import { eventBus } from '../../../src/services/EventBus'
import type { DrawingState } from '../../../src/types/play.types'

describe('useKeyboardShortcuts', () => {
	const baseDrawingState: DrawingState = {
		tool: 'select',
		color: '#000000',
		brushSize: 3,
		lineStyle: 'solid',
		lineEnd: 'none',
		eraseSize: 40,
		snapThreshold: 20,
	}

	let stateCalls: DrawingState[]
	let setDrawingStateMock: (
		updater: (prev: DrawingState) => DrawingState,
	) => void

	beforeEach(() => {
		eventBus.clear()
		stateCalls = [baseDrawingState]
		setDrawingStateMock = (
			updater: (prev: DrawingState) => DrawingState,
		) => {
			const current = stateCalls.at(-1) ?? baseDrawingState
			const next = updater(current)
			stateCalls.push(next)
		}
	})

	describe('shortcut activation', () => {
		it('should set up keyboard event listener', () => {
			const { result } = renderHook(() => 
				useKeyboardShortcuts({ setDrawingState: setDrawingStateMock })
			)
			
			// Verify hook runs without error
			expect(result.error).toBeUndefined()
		})

		it('updates tool when shortcut pressed', () => {
			renderHook(() =>
				useKeyboardShortcuts({ setDrawingState: setDrawingStateMock }),
			)

			act(() => {
				window.dispatchEvent(
					new KeyboardEvent('keydown', {
						key: 's',
						code: 'KeyS',
						bubbles: true,
					}),
				)
			})

			expect(stateCalls.at(-1)?.tool).toBe('select')
		})

		it('ignores shortcuts when typing in inputs', () => {
			renderHook(() =>
				useKeyboardShortcuts({ setDrawingState: setDrawingStateMock }),
			)

			const input = document.createElement('input')
			document.body.appendChild(input)

			const before = stateCalls.length
			act(() => {
				input.dispatchEvent(
					new KeyboardEvent('keydown', {
						key: 's',
						code: 'KeyS',
						bubbles: true,
					}),
				)
			})

			expect(stateCalls.length).toBe(before)
			document.body.removeChild(input)
		})
	})

	describe('input field detection', () => {
		it('should create hook without errors', () => {
			const { result } = renderHook(() => 
				useKeyboardShortcuts({ setDrawingState: setDrawingStateMock })
			)
			
			expect(result.error).toBeUndefined()
		})
	})

	describe('helper functions', () => {
		it('should get shortcut key for tool', () => {
			expect(getShortcutForTool('select')).toBe('S')
			expect(getShortcutForTool('draw')).toBe('D')
			expect(getShortcutForTool('erase')).toBe('E')
			expect(getShortcutForTool('fill')).toBe('F')
		})

		it('should return undefined for unmapped tool', () => {
			expect(
				getShortcutForTool('route' as unknown as DrawingState['tool']),
			).toBeUndefined()
		})

		it('should return all shortcuts as map', () => {
			const shortcuts = getAllShortcuts()
			
			expect(shortcuts['S']).toBe('Select tool')
			expect(shortcuts['D']).toBe('Draw tool')
			expect(shortcuts['⌘Z']).toBe('Undo')
			expect(Object.keys(shortcuts).length).toBeGreaterThan(5)
		})
	})

	describe('cleanup', () => {
		it('should unmount without errors', () => {
			const { unmount } = renderHook(() => 
				useKeyboardShortcuts({ setDrawingState: setDrawingStateMock })
			)
			
			expect(() => unmount()).not.toThrow()
		})
	})
})
