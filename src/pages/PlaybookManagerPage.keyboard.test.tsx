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

  it('should allow keyboard resize with arrow keys', async () => {
    const { container } = render(
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

    // Wait for loading to complete
    await waitFor(() => {
      const loadingText = container.querySelector('[data-testid="loading"]')
      expect(loadingText).toBeFalsy()
    })

    const handle = container.querySelector('[data-slot="resizable-handle"]')
    expect(handle).toBeTruthy()

    // Focus the handle
    handle?.focus()

    // Press right arrow - should increase width
    fireEvent.keyDown(handle!, { key: 'ArrowRight' })

    // Verify width increased in localStorage
    const storedWidth = Number(localStorage.getItem('playsmith-sidebar-width'))
    expect(storedWidth).toBeGreaterThan(256)
  })

  it('should respect min/max constraints with keyboard', async () => {
    localStorage.setItem('playsmith-sidebar-width', '200')

    const { container } = render(
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

    // Wait for loading to complete
    await waitFor(() => {
      const loadingText = container.querySelector('[data-testid="loading"]')
      expect(loadingText).toBeFalsy()
    })

    const handle = container.querySelector('[data-slot="resizable-handle"]')
    handle?.focus()

    // Try to go below minimum
    fireEvent.keyDown(handle!, { key: 'ArrowLeft' })

    const storedWidth = Number(localStorage.getItem('playsmith-sidebar-width'))
    expect(storedWidth).toBeGreaterThanOrEqual(200)
  })
})
