import { describe, test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { routes } from './router/routes'

describe('App', () => {
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
