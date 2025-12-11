/**
* Hook to handle keyboard shortcuts for the application
* Centralizes all keyboard shortcut logic
*/

import { useEffect } from 'react'
import { eventBus } from '../services/EventBus'
import type { DrawingState, Tool } from '../types/play.types'

interface KeyboardShortcutHandlers {
	setDrawingState: (updater: (prev: DrawingState) => DrawingState) => void
}

/**
* Map of keyboard shortcuts to their actions
*/
const SHORTCUTS = {
	s: 'select',
	a: 'addPlayer',
	d: 'draw',
	e: 'erase',
	c: 'color',
	f: 'fill',
	r: 'drawing',
	h: 'hash',
	g: 'addComponent',
} as const

/**
* Hook that sets up keyboard shortcuts for the application
* Handles tool switching and dialog opening via keyboard
*
* @param handlers - Object containing state setters for tool changes
*/
export function useKeyboardShortcuts({
	setDrawingState,
}: KeyboardShortcutHandlers): void {
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			// Ignore if user is typing in an input field
			if (event.target instanceof HTMLInputElement ||
					event.target instanceof HTMLTextAreaElement) {
				return
			}

			const key = event.key.toLowerCase()
			
			switch (key) {
				case 's':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'select' }))
					eventBus.emit('dialog:closeAll')
					break
				case 'a':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'addPlayer' }))
					eventBus.emit('player:add', {})
					eventBus.emit('dialog:closeAll')
					break
				case 'd':
					event.preventDefault()
					eventBus.emit('dialog:openDraw')
					break
				case 'e':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'erase' }))
					eventBus.emit('dialog:closeAll')
					break
				case 'c':
					event.preventDefault()
					eventBus.emit('dialog:openColorPicker')
					break
				case 'f':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'fill' }))
					eventBus.emit('dialog:closeAll')
					break
				case 'r':
					event.preventDefault()
					eventBus.emit('dialog:openDrawing')
					break
				case 'h':
					event.preventDefault()
					eventBus.emit('dialog:openHash')
					break
				case 'g':
					event.preventDefault()
					setDrawingState(prev => ({ ...prev, tool: 'addComponent' }))
					eventBus.emit('component:add')
					eventBus.emit('dialog:closeAll')
					break
				case 'delete':
				case 'backspace':
					event.preventDefault()
					eventBus.emit('selection:delete')
					break
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [setDrawingState])
}

/**
* Get the shortcut key for a specific tool
* Useful for displaying shortcuts in tooltips
*/
export function getShortcutForTool(tool: Tool): string | undefined {
	const entry = Object.entries(SHORTCUTS).find(([_, value]) => value == tool)
	return entry?.[0].toUpperCase()
}

/**
* Get all keyboard shortcuts as a map
* Useful for displaying a shortcuts reference
*/
export function getAllShortcuts(): Record<string, string> {
	return {
		'S': 'Select tool',
		'A': 'Add player',
		'D': 'Draw tool',
		'E': 'Erase tool',
		'C': 'Color picker',
		'F': 'Fill tool',
		'R': 'Drawing tool',
		'H': 'Hash alignment',
		'G': 'Add component',
		'Delete/⌫': 'Delete selected',
		'⌘Z': 'Undo',
	}
}
