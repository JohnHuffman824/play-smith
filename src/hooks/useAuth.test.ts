import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
	const originalFetch = global.fetch

	beforeEach(() => {
		// Clear all mocks
		mock.restore()
		cleanup()
	})

	afterEach(async () => {
		// Wait for any pending async operations to complete
		await waitFor(() => {}, { timeout: 50 })

		cleanup()

		// Restore original fetch to prevent pollution
		global.fetch = originalFetch
	})

	test('returns loading state initially', async () => {
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify({ id: 1, email: 'test@example.com' })))
		)

		const { result } = renderHook(() => useAuth())

		expect(result.current.loading).toBe(true)
		expect(result.current.user).toBe(null)

		// Wait for fetch to complete to prevent act warnings
		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})
	})

	test('returns user when authenticated', async () => {
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(mockUser)))
		)

		const { result } = renderHook(() => useAuth())

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.user).toEqual(mockUser)
	})

	test('returns null user when not authenticated', async () => {
		global.fetch = mock(() =>
			Promise.resolve(new Response(null, { status: 401 }))
		)

		const { result } = renderHook(() => useAuth())

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.user).toBe(null)
	})

	test('logout function clears user', async () => {
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(mockUser)))
		)

		const { result } = renderHook(() => useAuth())

		await waitFor(() => {
			expect(result.current.user).toEqual(mockUser)
		})

		// Mock logout endpoint
		global.fetch = mock(() =>
			Promise.resolve(new Response(null, { status: 200 }))
		)

		result.current.logout()

		await waitFor(() => {
			expect(result.current.user).toBe(null)
		})
	})
})
