// src/contexts/SettingsContext.test.tsx
import { describe, it, expect, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { SettingsProvider, useSettings } from './SettingsContext'

describe('SettingsContext - Sidebar Width', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should default sidebar width to 256', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })

    expect(result.current.sidebarWidth).toBe(256)
  })

  it('should persist sidebar width to localStorage', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })

    act(() => {
      result.current.setSidebarWidth(300)
    })

    expect(result.current.sidebarWidth).toBe(300)
    expect(localStorage.getItem('playsmith-sidebar-width')).toBe('300')
  })

  it('should load sidebar width from localStorage on mount', () => {
    localStorage.setItem('playsmith-sidebar-width', '320')

    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })

    expect(result.current.sidebarWidth).toBe(320)
  })

  it('should constrain sidebar width between 200-400', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    })

    // Test min constraint
    act(() => {
      result.current.setSidebarWidth(150)
    })
    expect(result.current.sidebarWidth).toBe(200)

    // Test max constraint
    act(() => {
      result.current.setSidebarWidth(500)
    })
    expect(result.current.sidebarWidth).toBe(400)
  })
})
