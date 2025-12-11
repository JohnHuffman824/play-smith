/**
 * Tests for TypedEventBus
 * Verifies type-safe event emission and handling
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { eventBus } from '../../../src/services/EventBus'

describe('TypedEventBus', () => {
	beforeEach(() => {
		// Clear all listeners before each test
		eventBus.clear()
	})

	describe('event subscription', () => {
		it('should call handler when event is emitted', () => {
			let called = false
			const handler = () => { called = true }
			
			eventBus.on('canvas:clear', handler)
			eventBus.emit('canvas:clear')
			
			expect(called).toBe(true)
		})

		it('should pass data to handler for events with payloads', () => {
			let receivedColor = ''
			let receivedId = ''
			
			const handler = (data: { id: string; color: string }) => {
				receivedId = data.id
				receivedColor = data.color
			}
			
			eventBus.on('player:fill', handler)
			eventBus.emit('player:fill', { id: 'player-1', color: '#ff0000' })
			
			expect(receivedId).toBe('player-1')
			expect(receivedColor).toBe('#ff0000')
		})

		it('should handle multiple handlers for same event', () => {
			let count = 0
			const handler1 = () => { count += 1 }
			const handler2 = () => { count += 10 }
			
			eventBus.on('canvas:undo', handler1)
			eventBus.on('canvas:undo', handler2)
			eventBus.emit('canvas:undo')
			
			expect(count).toBe(11)
		})

		it('should not call handler after unsubscribe', () => {
			let count = 0
			const handler = () => { count += 1 }
			
			eventBus.on('canvas:clear', handler)
			eventBus.emit('canvas:clear')
			expect(count).toBe(1)
			
			eventBus.off('canvas:clear', handler)
			eventBus.emit('canvas:clear')
			expect(count).toBe(1) // Still 1, not incremented
		})
	})

	describe('event isolation', () => {
		it('should not trigger handlers for different events', () => {
			let canvasClearCalled = false
			let canvasUndoCalled = false
			
			eventBus.on('canvas:clear', () => { canvasClearCalled = true })
			eventBus.on('canvas:undo', () => { canvasUndoCalled = true })
			
			eventBus.emit('canvas:clear')
			
			expect(canvasClearCalled).toBe(true)
			expect(canvasUndoCalled).toBe(false)
		})

		it('should handle events with different payload types', () => {
			let playerId: string | undefined
			let playerColor: string | undefined

			eventBus.on('player:fill', (data) => {
				playerId = data.id
				playerColor = data.color
			})

			eventBus.emit('player:fill', { id: 'player-1', color: '#ff0000' })

			expect(playerId).toBe('player-1')
			expect(playerColor).toBe('#ff0000')
		})
	})

	describe('listener management', () => {
		it('should return correct listener count', () => {
			const handler1 = () => {}
			const handler2 = () => {}
			
			expect(eventBus.listenerCount('canvas:clear')).toBe(0)
			
			eventBus.on('canvas:clear', handler1)
			expect(eventBus.listenerCount('canvas:clear')).toBe(1)
			
			eventBus.on('canvas:clear', handler2)
			expect(eventBus.listenerCount('canvas:clear')).toBe(2)
			
			eventBus.off('canvas:clear', handler1)
			expect(eventBus.listenerCount('canvas:clear')).toBe(1)
		})

		it('should clear all listeners for specific event', () => {
			const handler = () => {}
			
			eventBus.on('canvas:clear', handler)
			eventBus.on('canvas:undo', handler)
			
			eventBus.clear('canvas:clear')
			
			expect(eventBus.listenerCount('canvas:clear')).toBe(0)
			expect(eventBus.listenerCount('canvas:undo')).toBe(1)
		})

		it('should clear all listeners when no event specified', () => {
			const handler = () => {}
			
			eventBus.on('canvas:clear', handler)
			eventBus.on('canvas:undo', handler)
			eventBus.on('player:add', handler)
			
			eventBus.clear()
			
			expect(eventBus.listenerCount('canvas:clear')).toBe(0)
			expect(eventBus.listenerCount('canvas:undo')).toBe(0)
			expect(eventBus.listenerCount('player:add')).toBe(0)
		})
	})

	describe('edge cases', () => {
		it('should not error when emitting event with no listeners', () => {
			expect(() => {
				eventBus.emit('canvas:clear')
			}).not.toThrow()
		})

		it('should not error when unsubscribing non-existent handler', () => {
			const handler = () => {}
			expect(() => {
				eventBus.off('canvas:clear', handler)
			}).not.toThrow()
		})

		it('should allow same handler to be added multiple times', () => {
			let count = 0
			const handler = () => { count += 1 }
			
			eventBus.on('canvas:undo', handler)
			eventBus.on('canvas:undo', handler)
			eventBus.emit('canvas:undo')
			
			// Sets don't allow duplicates, so count should be 1
			expect(count).toBe(1)
		})
	})
})
