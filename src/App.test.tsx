import { afterEach, describe, test, expect } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { routes } from './router/routes'

describe('App', () => {

	afterEach(() => {
		cleanup()
	})

	test('renders router with landing page by default', () => {
		// Use createMemoryRouter for testing with initial entry at root
		const router = createMemoryRouter(routes, {
			initialEntries: ['/']
		})

		render(
			<SettingsProvider>
				<RouterProvider router={router} />
			</SettingsProvider>
		)

		// Should render landing page at root
		expect(screen.getByText('Play Smith')).toBeDefined()
	})
})
