import { describe, test, expect, mock, beforeAll, beforeEach, afterAll, afterEach } from 'bun:test'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { LoginModal } from '../../../src/components/auth/LoginModal'
import { AuthProvider } from '../../../src/contexts/AuthContext'

const originalFetch = global.fetch
const mockFetch = mock()

function renderLoginModal() {
	mockFetch.mockResolvedValue(
		new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	)

	return render(
		<AuthProvider>
			<LoginModal />
		</AuthProvider>
	)
}

describe('LoginModal', () => {
	beforeAll(() => {
		global.fetch = mockFetch as any
	})

	beforeEach(() => {
		mockFetch.mockReset()
	})

	afterEach(() => {
		cleanup()
	})

	afterAll(() => {
		global.fetch = originalFetch
	})
	test('renders login form by default', () => {
		renderLoginModal()

		expect(screen.getByText('Play Smith')).toBeDefined()
		expect(screen.getByLabelText(/Username or Email/i)).toBeDefined()
		expect(screen.getByPlaceholderText('Enter your password')).toBeDefined()
		expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined()
	})

	test('switches to register mode', () => {
		renderLoginModal()

		const signUpButton = screen.getByText('Sign up')
		fireEvent.click(signUpButton)

		expect(screen.getByLabelText(/Name/i)).toBeDefined()
		expect(screen.getByLabelText(/Email/i)).toBeDefined()
		expect(screen.getByRole('button', { name: /Create Account/i })).toBeDefined()
	})

	test('shows validation error for invalid email in register mode', async () => {
		renderLoginModal()

		// Switch to register
		fireEvent.click(screen.getByText('Sign up'))

		const nameInput = screen.getByLabelText(/Name/i)
		const emailInput = screen.getByLabelText(/Email/i)
		const passwordInput = screen.getByPlaceholderText('Enter your password')
		const submitButton = screen.getByRole('button', { name: /Create Account/i })

		fireEvent.change(nameInput, { target: { value: 'Test User' } })
		fireEvent.change(emailInput, { target: { value: 'notanemail' } })
		fireEvent.change(passwordInput, { target: { value: 'validpassword' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText(/Please enter a valid email address/i)).toBeDefined()
		})
	})

	test('shows validation error for weak password', async () => {
		renderLoginModal()

		// Switch to register
		fireEvent.click(screen.getByText('Sign up'))

		const nameInput = screen.getByLabelText(/Name/i)
		const emailInput = screen.getByLabelText(/Email/i)
		const passwordInput = screen.getByPlaceholderText('Enter your password')
		const submitButton = screen.getByRole('button', { name: /Create Account/i })

		fireEvent.change(nameInput, { target: { value: 'Test User' } })
		fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
		fireEvent.change(passwordInput, { target: { value: '123' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(screen.getByText(/Password must be at least 6 characters/i)).toBeDefined()
		})
	})

	test('toggles password visibility', () => {
		renderLoginModal()

		const passwordInput = screen.getByPlaceholderText('Enter your password') as HTMLInputElement
		const toggleButton = screen.getByRole('button', { name: 'Toggle password visibility' })

		expect(passwordInput.type).toBe('password')

		fireEvent.click(toggleButton)
		expect(passwordInput.type).toBe('text')

		fireEvent.click(toggleButton)
		expect(passwordInput.type).toBe('password')
	})

	test('submits login form', async () => {
		renderLoginModal()

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'test@example.com', name: 'Test' },
			}),
		} as Response)

		const emailInput = screen.getByLabelText(/Username or Email/i)
		const passwordInput = screen.getByPlaceholderText('Enter your password')
		const submitButton = screen.getByRole('button', { name: /Sign In/i })

		fireEvent.change(emailInput, { target: { value: 'admin' } })
		fireEvent.change(passwordInput, { target: { value: 'admin' } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				'/api/auth/login',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ email: 'admin', password: 'admin' }),
				})
			)
		})
	})

	test('displays error message on failed login', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ user: null }),
		} as Response)

		renderLoginModal()

		// Wait for initial render to complete
		await waitFor(() => {
			expect(screen.getByLabelText(/Username or Email/i)).toBeDefined()
		})

		// Mock failed login
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: async () => ({ error: 'Invalid email or password' }),
		} as Response)

		const emailInput = screen.getByLabelText(/Username or Email/i)
		const passwordInput = screen.getByPlaceholderText('Enter your password')
		const submitButton = screen.getByRole('button', { name: /Sign In/i })

		fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
		fireEvent.change(passwordInput, { target: { value: 'wrong' } })
		fireEvent.click(submitButton)

		// Wait for error message to appear
		await waitFor(() => {
			const errorMessage = screen.queryByText(/Invalid email or password/i)
			expect(errorMessage).toBeDefined()
		}, { timeout: 3000 })
	})
})
