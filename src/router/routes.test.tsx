import { describe, test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from './routes'

describe('routes', () => {
	test('landing page route works', () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/']
		})

		render(<RouterProvider router={router} />)

		expect(screen.getByText('Play Smith')).toBeDefined()
	})

	test('login page route works', () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/login']
		})

		render(<RouterProvider router={router} />)

		expect(screen.getByText('Login')).toBeDefined()
	})

	test('404 page route works', () => {
		const router = createMemoryRouter(routes, {
			initialEntries: ['/nonexistent']
		})

		render(<RouterProvider router={router} />)

		expect(screen.getByText('404')).toBeDefined()
		expect(screen.getByText('Page not found')).toBeDefined()
	})
})
