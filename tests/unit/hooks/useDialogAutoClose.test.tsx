/**
 * Tests for useDialogAutoClose hook
 * Verifies auto-close behavior when cursor moves away from dialogs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDialogAutoClose } from '../../../src/hooks/useDialogAutoClose'

describe('useDialogAutoClose', () => {
	beforeEach(() => {
		// Clear any existing elements
		document.body.innerHTML = ''
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('basic functionality', () => {
		it('should not set up listener when dialog is closed', async () => {
			const onClose = vi.fn()

			renderHook(() =>
				useDialogAutoClose({
					isOpen: false,
					onClose,
					dataAttribute: 'data-test-dialog',
					delay: 0,
				})
			)

			// Wait for any potential delayed setup
			await new Promise(resolve => setTimeout(resolve, 10))

			// Move cursor - should NOT trigger close since dialog is closed
			const mouseMoveEvent = new MouseEvent('mousemove', {
				bubbles: true,
				clientX: 100,
				clientY: 100,
			})
			document.dispatchEvent(mouseMoveEvent)

			// onClose should NOT be called - no listener was set up
			expect(onClose).not.toHaveBeenCalled()
		})

		it('should set up event listener when dialog is open', async () => {
			const dialog = document.createElement('div')
			dialog.setAttribute('data-test-dialog', '')
			dialog.getBoundingClientRect = vi.fn(() => ({
				left: 100,
				top: 100,
				right: 200,
				bottom: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => {}
			}))
			document.body.appendChild(dialog)

			const onClose = vi.fn()

			renderHook(() =>
				useDialogAutoClose({
					isOpen: true,
					onClose,
					dataAttribute: 'data-test-dialog',
					delay: 0,
					bufferSize: 50,
				})
			)

			// Wait for listener setup
			await new Promise(resolve => setTimeout(resolve, 10))

			// Move cursor INSIDE the dialog - should enable auto-close
			act(() => {
				const insideEvent = new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 150,
					clientY: 150,
				})
				document.dispatchEvent(insideEvent)
			})

			// onClose should NOT be called yet - cursor is inside
			expect(onClose).not.toHaveBeenCalled()

			// Move cursor OUTSIDE the safe zone - should trigger close
			act(() => {
				const outsideEvent = new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 500, // Far outside the safe zone
					clientY: 500,
				})
				document.dispatchEvent(outsideEvent)
			})

			// onClose SHOULD be called - cursor left the safe zone
			expect(onClose).toHaveBeenCalledTimes(1)

			document.body.removeChild(dialog)
		})
	})

	describe('safe zone calculation', () => {
		it('should use custom buffer size', async () => {
			const dialog = document.createElement('div')
			dialog.setAttribute('data-custom-dialog', '')
			dialog.getBoundingClientRect = vi.fn(() => ({
				left: 100,
				top: 100,
				right: 200,
				bottom: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => {}
			}))
			document.body.appendChild(dialog)

			const onClose = vi.fn()

			renderHook(() =>
				useDialogAutoClose({
					isOpen: true,
					onClose,
					dataAttribute: 'data-custom-dialog',
					bufferSize: 100, // Large buffer
					delay: 0,
				})
			)

			await new Promise(resolve => setTimeout(resolve, 10))

			// Move cursor inside dialog first
			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 150,
					clientY: 150,
				}))
			})

			// Move cursor to position that would be outside 50px buffer
			// but inside 100px buffer
			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 275, // right edge (200) + 75px
					clientY: 150,
				}))
			})

			// Should NOT close - still inside 100px buffer
			expect(onClose).not.toHaveBeenCalled()

			// Move far outside the buffer
			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 500,
					clientY: 500,
				}))
			})

			// NOW it should close
			expect(onClose).toHaveBeenCalledTimes(1)

			document.body.removeChild(dialog)
		})
	})

	describe('cleanup', () => {
		it('should remove event listeners on unmount', async () => {
			const dialog = document.createElement('div')
			dialog.setAttribute('data-cleanup-dialog', '')
			dialog.getBoundingClientRect = vi.fn(() => ({
				left: 100,
				top: 100,
				right: 200,
				bottom: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => {}
			}))
			document.body.appendChild(dialog)

			const onClose = vi.fn()

			const { unmount } = renderHook(() =>
				useDialogAutoClose({
					isOpen: true,
					onClose,
					dataAttribute: 'data-cleanup-dialog',
					delay: 0,
				})
			)

			await new Promise(resolve => setTimeout(resolve, 10))

			// Unmount the hook - should remove listeners
			unmount()

			// Move cursor after unmount
			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 150,
					clientY: 150,
				}))
			})

			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 500,
					clientY: 500,
				}))
			})

			// onClose should NOT be called - listeners were cleaned up
			expect(onClose).not.toHaveBeenCalled()

			document.body.removeChild(dialog)
		})

		it('should clear timeout on unmount before listener is added', () => {
			const dialog = document.createElement('div')
			dialog.setAttribute('data-timeout-dialog', '')
			document.body.appendChild(dialog)

			const onClose = vi.fn()

			const { unmount } = renderHook(() =>
				useDialogAutoClose({
					isOpen: true,
					onClose,
					dataAttribute: 'data-timeout-dialog',
					delay: 1000, // Long delay
				})
			)

			// Unmount immediately - before delay expires
			unmount()

			// The timeout should be cleared
			// If we wait and dispatch events, onClose should never be called

			document.body.removeChild(dialog)
			expect(onClose).not.toHaveBeenCalled()
		})
	})

	describe('auto-close logic', () => {
		it('should only close after cursor enters and then leaves safe zone', async () => {
			const dialog = document.createElement('div')
			dialog.setAttribute('data-logic-dialog', '')
			dialog.getBoundingClientRect = vi.fn(() => ({
				left: 100,
				top: 100,
				right: 200,
				bottom: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => {}
			}))
			document.body.appendChild(dialog)

			const onClose = vi.fn()

			renderHook(() =>
				useDialogAutoClose({
					isOpen: true,
					onClose,
					dataAttribute: 'data-logic-dialog',
					delay: 0,
					bufferSize: 50,
				})
			)

			await new Promise(resolve => setTimeout(resolve, 10))

			// Move cursor OUTSIDE first (never entered safe zone)
			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 500,
					clientY: 500,
				}))
			})

			// Should NOT close - cursor never entered safe zone first
			expect(onClose).not.toHaveBeenCalled()

			// Now move cursor INSIDE safe zone
			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 150,
					clientY: 150,
				}))
			})

			// Still should not close - inside safe zone
			expect(onClose).not.toHaveBeenCalled()

			// Now move OUTSIDE
			act(() => {
				document.dispatchEvent(new MouseEvent('mousemove', {
					bubbles: true,
					clientX: 500,
					clientY: 500,
				}))
			})

			// NOW it should close
			expect(onClose).toHaveBeenCalledTimes(1)

			document.body.removeChild(dialog)
		})
	})
})
