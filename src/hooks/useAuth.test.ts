import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
	beforeEach(() => {
		// Clear all mocks
		mock.restore()
	})

	test('returns loading state initially', () => {
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify({ id: 1, email: 'test@example.com' })))
		)

		let result: any
		act(() => {
			result = renderHook(() => useAuth()).result
		})

		expect(result.current.loading).toBe(true)
		expect(result.current.user).toBe(null)
	})

	test('returns user when authenticated', async () => {
		const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
		global.fetch = mock(() =>
			Promise.resolve(new Response(JSON.stringify(mockUser)))
		)

		let result: any
		await act(async () => {
			result = renderHook(() => useAuth()).result
		})

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.user).toEqual(mockUser)
	})

	test('returns null user when not authenticated', async () => {
		global.fetch = mock(() =>
			Promise.resolve(new Response(null, { status: 401 }))
		)

		let result: any
		await act(async () => {
			result = renderHook(() => useAuth()).result
		})

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

		let result: any
		await act(async () => {
			result = renderHook(() => useAuth()).result
		})

		await waitFor(() => {
			expect(result.current.user).toEqual(mockUser)
		})

		// Mock logout endpoint
		global.fetch = mock(() =>
			Promise.resolve(new Response(null, { status: 200 }))
		)

		await act(async () => {
			result.current.logout()
		})

		await waitFor(() => {
			expect(result.current.user).toBe(null)
		})
	})
})
