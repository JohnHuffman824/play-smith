import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlaybookManagerPage } from './PlaybookManagerPage'
import { SettingsProvider } from '../contexts/SettingsContext'
import { AuthProvider } from '../contexts/AuthContext'
import { TeamProvider } from '../contexts/TeamContext'

// Mock the API query modules
vi.mock('../api/queries/playbookQueries', () => ({
  playbookKeys: {
    list: () => ['playbooks'],
    detail: (id: number) => ['playbooks', id],
  },
  fetchPlaybooks: vi.fn(),
}))

vi.mock('../api/queries/teamQueries', () => ({
  teamKeys: {
    list: () => ['teams'],
    members: (teamId: number) => ['teams', teamId, 'members'],
  },
  fetchTeams: vi.fn(),
}))

vi.mock('../api/queries/folderQueries', () => ({
  folderKeys: {
    list: () => ['folders'],
  },
  fetchFolders: vi.fn(),
}))

import * as playbookQueries from '../api/queries/playbookQueries'
import * as teamQueries from '../api/queries/teamQueries'
import * as folderQueries from '../api/queries/folderQueries'

describe('PlaybookManagerPage - Keyboard Accessibility', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    localStorage.clear()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    // Mock API responses
    const mockPlaybooksQuery = playbookQueries.fetchPlaybooks as any
    mockPlaybooksQuery.mockResolvedValue([])
    const mockTeamsQuery = teamQueries.fetchTeams as any
    mockTeamsQuery.mockResolvedValue([])
    const mockFoldersQuery = folderQueries.fetchFolders as any
    mockFoldersQuery.mockResolvedValue([])
  })

  it('should have keyboard accessible resize handle', async () => {
    const { container, getByText } = render(
      <SettingsProvider>
        <AuthProvider>
          <TeamProvider>
            <BrowserRouter>
              <QueryClientProvider client={queryClient}>
                <PlaybookManagerPage />
              </QueryClientProvider>
            </BrowserRouter>
          </TeamProvider>
        </AuthProvider>
      </SettingsProvider>
    )

    // Wait for page to render by checking for sidebar content
    await waitFor(() => {
      expect(getByText('All Playbooks')).toBeTruthy()
    })

    const handle = container.querySelector('[data-slot="resizable-handle"]') as HTMLElement
    expect(handle).toBeTruthy()

    // Verify handle is keyboard accessible (focusable)
    // react-resizable-panels sets tabIndex to 0 by default
    expect(handle.tabIndex).toBe(0)

    // Verify handle can be focused
    handle.focus()
    expect(document.activeElement).toBe(handle)

    // Verify handle has proper role for accessibility
    // react-resizable-panels handles keyboard events internally
    expect(handle.getAttribute('role')).toBe('separator')
  })

  it('should have ARIA role for screen readers', async () => {
    const { container, getByText } = render(
      <SettingsProvider>
        <AuthProvider>
          <TeamProvider>
            <BrowserRouter>
              <QueryClientProvider client={queryClient}>
                <PlaybookManagerPage />
              </QueryClientProvider>
            </BrowserRouter>
          </TeamProvider>
        </AuthProvider>
      </SettingsProvider>
    )

    // Wait for page to render by checking for sidebar content
    await waitFor(() => {
      expect(getByText('All Playbooks')).toBeTruthy()
    })

    const handle = container.querySelector('[data-slot="resizable-handle"]') as HTMLElement
    expect(handle).toBeTruthy()

    // Verify ARIA role for accessibility (provided by react-resizable-panels)
    expect(handle.getAttribute('role')).toBe('separator')

    // Verify it's keyboard navigable
    expect(handle.tabIndex).toBe(0)
  })
})
