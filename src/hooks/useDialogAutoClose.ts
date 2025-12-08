/**
 * Hook to auto-close dialogs when cursor moves away
 * Eliminates duplicated auto-close logic across multiple dialogs
 */

import { useEffect } from 'react'

interface UseDialogAutoCloseOptions {
	isOpen: boolean
	onClose: () => void
	dataAttribute: string
	bufferSize?: number
	delay?: number
}

/**
 * Auto-closes a dialog when the cursor moves away from it
 * 
 * @param isOpen - Whether the dialog is currently open
 * @param onClose - Function to call to close the dialog
 * @param dataAttribute - data-* attribute selector for the dialog element
 * @param bufferSize - Safe zone buffer around dialog in pixels (default: 50)
 * @param delay - Delay before enabling auto-close in ms (default: 100)
 */
export function useDialogAutoClose({
	isOpen,
	onClose,
	dataAttribute,
	bufferSize = 50,
	delay = 100,
}: UseDialogAutoCloseOptions): void {
	useEffect(() => {
		if (!isOpen) return

		let shouldAutoClose = false

		const handleMouseMove = (e: MouseEvent) => {
			// Get the dialog element position
			const dialogElement = document.querySelector(`[${dataAttribute}]`)
			if (!dialogElement) return

			const dialogRect = dialogElement.getBoundingClientRect()
			
			// Create a buffer zone around the dialog
			const safeZone = {
				left: dialogRect.left - bufferSize,
				right: dialogRect.right + bufferSize,
				top: dialogRect.top - bufferSize,
				bottom: dialogRect.bottom + bufferSize,
			}

			// Check if cursor is inside the safe zone
			const isInsideSafeZone =
				e.clientX >= safeZone.left &&
				e.clientX <= safeZone.right &&
				e.clientY >= safeZone.top &&
				e.clientY <= safeZone.bottom

			// If cursor is in safe zone, enable auto-close for future movements
			if (isInsideSafeZone) {
				shouldAutoClose = true
			}

			// Only close if auto-close was enabled (cursor was in dialog) and now outside
			if (shouldAutoClose && !isInsideSafeZone) {
				onClose()
			}
		}

		// Add event listener with a small delay to prevent immediate closing
		const timer = setTimeout(() => {
			document.addEventListener('mousemove', handleMouseMove)
		}, delay)

		return () => {
			clearTimeout(timer)
			document.removeEventListener('mousemove', handleMouseMove)
		}
	}, [isOpen, onClose, dataAttribute, bufferSize, delay])
}
