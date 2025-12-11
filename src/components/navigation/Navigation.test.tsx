import { afterEach, describe, test, expect, mock } afterEach } from 'bun:test'
import { afterEach, cleanup, render, screen } from '@testing-library/react'
import { afterEach, MemoryRouter } from 'react-router-dom'
import { afterEach, Navigation } from './Navigation'

mock.module('../../hooks/useAuth', () => ({
	useAuth: mock(() => ({
		user: { id: 1, email: 'test@example.com', name: 'Test User' },
		loading: false,
		logout: () => {}
	}))
}))

describe('Navigation', () => {

	afterEach(() => {
		cleanup()
	})

	test('renders user name', () => {
		render(
			<MemoryRouter>
				<Navigation />
			</MemoryRouter>
		)

		expect(screen.getByText('Test User')).toBeDefined()
	})

	test('renders playbooks link', () => {
		render(
			<MemoryRouter>
				<Navigation />
			</MemoryRouter>
		)

		expect(screen.getByText('Playbooks')).toBeDefined()
	})

	test('renders logout button', () => {
		render(
			<MemoryRouter>
				<Navigation />
			</MemoryRouter>
		)

		expect(screen.getByText('Logout')).toBeDefined()
	})
})
