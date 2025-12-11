import { afterEach, describe, test, expect } afterEach } from 'bun:test'
import { afterEach, cleanup, render, screen } from '@testing-library/react'
import { afterEach, RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, ThemeProvider } from './contexts/ThemeContext'
import { afterEach, routes } from './router/routes'

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
			<ThemeProvider>
				<RouterProvider router={router} />
			</ThemeProvider>
		)

		// Should render landing page at root
		expect(screen.getByText('Play Smith')).toBeDefined()
	})
})
