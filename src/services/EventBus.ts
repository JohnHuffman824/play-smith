/**
 * Type-safe event bus for application-wide event communication
 * Replaces the unsafe window.dispatchEvent/addEventListener pattern
 */

import type { Drawing } from '../types/drawing.types'

/**
 * Central registry of all application events with their payload types
 */
export type EventMap = {
	// Tool change events
	'tool:select': void
	'tool:draw': void
	'tool:erase': void
	'tool:fill': void
	'tool:addPlayer': void
	'tool:addComponent': void
	
	// Dialog events
	'dialog:closeAll': void
	'dialog:openColorPicker': void
	'dialog:openDraw': void
	'dialog:openDrawing': void
	'dialog:openHash': void
	
	// Canvas operations
	'canvas:clear': void
	'canvas:undo': void
	'canvas:save': void
	
	// Player operations
	'player:add': { x?: number; y?: number }
	'player:fill': { id: string; color: string }
	
	// Lineman operations
	'lineman:fill': { id: number; color: string }
	
	// Component operations
	'component:add': void
	
	// Drawing operations
	'drawing:add': { drawing: unknown }
	'drawing:delete': { id: string }
	'drawing:update': { id: string; drawing: Partial<Drawing> }

	// Selection operations
	'selection:delete': void

	// System events
	'system:resize': void

	// Animation events
	'animation:play': void
	'animation:pause': void
	'animation:stop': void
	'animation:seek': { progress: number }
	'animation:speed': { speed: number }
	'animation:next': void
	'animation:prev': void
	'animation:toggleGhost': void
	'animation:toggleLoop': void
	'animation:openViewer': { playId: string }
	'animation:closeViewer': void
}

type EventHandler<T> = T extends void ? () => void : (data: T) => void
type EventKey = keyof EventMap
type AnyEventHandler = EventHandler<EventMap[EventKey]>

/**
 * Type-safe event bus implementation
 */
class TypedEventBus {
	private listeners = new Map<EventKey, Set<AnyEventHandler>>()

	private getHandlers<K extends EventKey>(
		event: K
	): Set<EventHandler<EventMap[K]>> | undefined {
		return this.listeners.get(event) as
			| Set<EventHandler<EventMap[K]>>
			| undefined
	}

	/**
	 * Subscribe to an event
	 */
	on<K extends keyof EventMap>(
		event: K,
		handler: EventHandler<EventMap[K]>
	): void {
		const handlers = this.getHandlers(event)
		if (!handlers) {
			const newHandlers = new Set<EventHandler<EventMap[K]>>()
			newHandlers.add(handler)
			this.listeners.set(event, newHandlers)
			return
		}
		handlers.add(handler)
	}

	/**
	 * Unsubscribe from an event
	 */
	off<K extends keyof EventMap>(
		event: K,
		handler: EventHandler<EventMap[K]>
	): void {
		this.getHandlers(event)?.delete(handler)
	}

	/**
	 * Emit an event
	 */
	emit<K extends keyof EventMap>(
		event: K,
		...args: EventMap[K] extends void ? [] : [EventMap[K]]
	): void {
		const handlers = this.getHandlers(event)
		if (!handlers) {
			return
		}
		handlers.forEach(handler => {
			if (args.length > 0) {
				handler(args[0])
			} else {
				handler()
			}
		})
	}

	/**
	 * Remove all listeners for an event, or all listeners if no event specified
	 */
	clear(event?: keyof EventMap): void {
		if (event) {
			this.listeners.delete(event)
		} else {
			this.listeners.clear()
		}
	}

	/**
	 * Get count of listeners for debugging
	 */
	listenerCount(event: keyof EventMap): number {
		const handlers = this.getHandlers(event)
		return handlers?.size ?? 0
	}
}

/**
 * Singleton instance of the event bus
 * Import this to use events throughout the application
 */
export const eventBus = new TypedEventBus()
