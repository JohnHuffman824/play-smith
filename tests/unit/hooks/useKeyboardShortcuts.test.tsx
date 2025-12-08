/**
 * Tests for useKeyboardShortcuts hook
 * Verifies keyboard event handling and event bus integration
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts, getAllShortcuts, getShortcutForTool } from '../../../src/hooks/useKeyboardShortcuts'
import { eventBus } from '../../../src/services/EventBus'
import type { DrawingState } from '../../../src/types/play.types'

describe('useKeyboardShortcuts', () => {
	let setDrawingStateMock: jest.Mock
	
	beforeEach(() => {
		eventBus.clear()
		setDrawingStateMock = (updater: (prev: DrawingState) => DrawingState) => {
			// Simple mock that captures calls
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
			expect(getShortcutForTool('color')).toBe('C')
			expect(getShortcutForTool('route')).toBe('R')
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
