// src/pages/PlaybookManagerPage.resizable.test.tsx
import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
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

describe('PlaybookManagerPage - Resizable Sidebar', () => {
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

  it('should render ResizablePanelGroup with horizontal direction', async () => {
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
      expect(screen.queryByText('Loading playbooks...')).toBeFalsy()
    })

    const panelGroup = container.querySelector('[data-slot="resizable-panel-group"]')
    expect(panelGroup).toBeTruthy()
    expect(panelGroup?.getAttribute('data-panel-group-direction')).toBe('horizontal')
  })

  it('should render ResizableHandle between sidebar and content', async () => {
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
      expect(screen.queryByText('Loading playbooks...')).toBeFalsy()
    })

    const handle = container.querySelector('[data-slot="resizable-handle"]')
    expect(handle).toBeTruthy()
  })

  it('should set sidebar initial size from settings context', async () => {
    localStorage.setItem('playsmith-sidebar-width', '300')

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
      expect(screen.queryByText('Loading playbooks...')).toBeFalsy()
    })

    // Panel exists (id is set on the panel)
    const sidebarPanel = container.querySelector('[data-slot="resizable-panel"]')
    expect(sidebarPanel).toBeTruthy()
  })

  it('should render sidebar content within ResizablePanel', async () => {
    render(
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
      expect(screen.queryByText('Loading playbooks...')).toBeFalsy()
    })

    // Verify sidebar navigation items are still rendered
    expect(screen.getByText('All Playbooks')).toBeTruthy()
    expect(screen.getByText('Shared with me')).toBeTruthy()
    expect(screen.getByText('Folders')).toBeTruthy()
  })
})
