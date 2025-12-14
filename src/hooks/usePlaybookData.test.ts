import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { renderHook, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { usePlaybookData } from './usePlaybookData'
import React from 'react'

// Mock fetch
const mockFetch = mock(() => Promise.resolve({
	ok: true,
	status: 200,
	json: () => Promise.resolve({})
}))

describe('usePlaybookData', () => {
	beforeEach(() => {
		globalThis.fetch = mockFetch
	})

	test('groups plays into correct sections when IDs are numeric from API', async () => {
		// API returns numeric IDs (the actual bug scenario)
		const playsData = {
			plays: [
				{ id: 1, name: 'Play A', section_id: 10 },
				{ id: 2, name: 'Play B', section_id: 10 },
				{ id: 3, name: 'Play C', section_id: null }
			]
		}
		const sectionsData = {
			sections: [
				{ id: 10, name: 'Run Plays', section_type: 'standard' }
			]
		}

		mockFetch.mockImplementation((url: string) => {
			if (url.includes('/plays')) {
				return Promise.resolve(new Response(JSON.stringify(playsData), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				}))
			}
			if (url.includes('/sections')) {
				return Promise.resolve(new Response(JSON.stringify(sectionsData), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				}))
			}
			return Promise.resolve(new Response('{}', { status: 200 }))
		})

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(BrowserRouter, null, children)
		const { result } = renderHook(() => usePlaybookData('1'), { wrapper })

		// Wait for loading to complete
		await waitFor(() => expect(result.current.isLoading).toBe(false))

		// Give it a moment for state updates to propagate
		await new Promise(resolve => setTimeout(resolve, 100))

		// Should have 2 sections: unsectioned and "Run Plays"
		expect(result.current.sections.length).toBe(2)

		// Find the "Run Plays" section
		const runPlays = result.current.sections.find(s => s.name === 'Run Plays')
		expect(runPlays).toBeDefined()
		expect(runPlays?.plays.length).toBe(2)  // Play A and Play B

		// Find unsectioned
		const unsectioned = result.current.sections.find(s => s.id === '__unsectioned__')
		expect(unsectioned).toBeDefined()
		expect(unsectioned?.plays.length).toBe(1)  // Play C
	})
})
