import { describe, test, expect, afterEach } from 'bun:test'
import { renderHook, cleanup } from '@testing-library/react'
import {
	PlayTransitionProvider,
	usePlayTransition
} from '../../../src/contexts/PlayTransitionContext'

describe('PlayTransitionContext', () => {
	afterEach(cleanup)

	test('provides registration function', () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<PlayTransitionProvider>{children}</PlayTransitionProvider>
		)
		const { result } = renderHook(() => usePlayTransition(), { wrapper })
		expect(typeof result.current.registerCard).toBe('function')
		expect(typeof result.current.getCardPosition).toBe('function')
	})

	test('getCardPosition returns null for unregistered card', () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<PlayTransitionProvider>{children}</PlayTransitionProvider>
		)
		const { result } = renderHook(() => usePlayTransition(), { wrapper })
		expect(result.current.getCardPosition('unknown-id')).toBeNull()
	})
})
