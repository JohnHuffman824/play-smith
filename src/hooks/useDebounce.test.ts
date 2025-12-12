import { describe, test, expect } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  test('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500))
    expect(result.current).toBe('test')
  })

  test('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    )

    expect(result.current).toBe('initial')

    // Update value
    rerender({ value: 'updated', delay: 100 })

    // Value should still be initial immediately after update
    expect(result.current).toBe('initial')

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 150))

    // Now value should be updated
    expect(result.current).toBe('updated')
  })

  test('cancels previous timeout when value changes rapidly', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })
    await new Promise(resolve => setTimeout(resolve, 50))

    rerender({ value: 'third' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Should still be 'first' because we haven't waited full delay
    expect(result.current).toBe('first')

    // Wait for full delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Should be 'third' (the last value)
    expect(result.current).toBe('third')
  })
})
