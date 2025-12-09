/**
* Type-safe event bus for application-wide event communication
* Replaces the unsafe window.dispatchEvent/addEventListener pattern
*/

import type { Tool } from '../types/play.types'
import type { HashAlignment } from '../types/field.types'
import type { Drawing } from '../types/drawing.types'

/**
* Central registry of all application events with their payload types
*/
export interface EventMap {
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
	
	// System events
	'system:resize': void
}

type EventHandler<T> = T extends void ? () => void : (data: T) => void

/**
* Type-safe event bus implementation
*/
class TypedEventBus {
	private listeners = new Map<keyof EventMap, Set<Function>>()

	/**
	 * Subscribe to an event
	 */
	on<K extends keyof EventMap>(
		event: K,
		handler: EventHandler<EventMap[K]>
	): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set())
		}
		this.listeners.get(event)!.add(handler)
	}

	/**
	 * Unsubscribe from an event
	 */
	off<K extends keyof EventMap>(
		event: K,
		handler: EventHandler<EventMap[K]>
	): void {
		this.listeners.get(event)?.delete(handler)
	}

	/**
	 * Emit an event
	 */
	emit<K extends keyof EventMap>(
		event: K,
		...args: EventMap[K] extends void ? [] : [EventMap[K]]
	): void {
		const handlers = this.listeners.get(event)
		if (handlers) {
			handlers.forEach(handler => {
				if (args.length > 0) {
					(handler as Function)(args[0])
				} else {
					(handler as Function)()
				}
			})
		}
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
		return this.listeners.get(event)?.size ?? 0
	}
}

/**
* Singleton instance of the event bus
* Import this to use events throughout the application
*/
export const eventBus = new TypedEventBus()
