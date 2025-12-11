import { describe, test, expect, mock, beforeAll, beforeEach, afterAll, afterEach } from 'bun:test'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import { LoginModal } from '../../../src/components/auth/LoginModal'
import { AuthProvider } from '../../../src/contexts/AuthContext'

const originalFetch = global.fetch
const mockFetch = mock()

async function renderLoginModal() {
	// Mock the initial session check that AuthProvider makes on mount
	mockFetch.mockResolvedValueOnce(
		new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	)

	const result = render(
		<AuthProvider>
			<LoginModal />
		</AuthProvider>
	)

	// Wait for the initial session check to complete
	await waitFor(() => {
		expect(screen.getByLabelText(/Username or Email/i)).toBeDefined()
	})

	return result
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
	test('renders login form by default', async () => {
		await renderLoginModal()

		expect(screen.getByText('Play Smith')).toBeDefined()
		expect(screen.getByLabelText(/Username or Email/i)).toBeDefined()
		expect(screen.getByPlaceholderText('Enter your password')).toBeDefined()
		expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined()
	})

	test('switches to register mode', async () => {
		await renderLoginModal()

		const signUpButton = screen.getByText('Sign up')
		fireEvent.click(signUpButton)

		// Wait for register mode to be active
		await waitFor(() => {
			expect(screen.getByLabelText(/Name/i)).toBeDefined()
			expect(screen.getByLabelText(/Email/i)).toBeDefined()
			expect(screen.getByRole('button', { name: /Create Account/i })).toBeDefined()
		})
	})

	test('shows validation error for invalid email in register mode', async () => {
		await renderLoginModal()

		// Switch to register
		fireEvent.click(screen.getByText('Sign up'))

		// Wait for register mode to be active
		const submitButton = await screen.findByRole('button', { name: /Create Account/i })

		const nameInput = screen.getByLabelText(/Name/i)
		const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement
		const passwordInput = screen.getByPlaceholderText('Enter your password')
		const form = emailInput.closest('form')!

		// Fill in form with invalid email
		fireEvent.change(nameInput, { target: { value: 'Test User' } })
		fireEvent.change(emailInput, { target: { value: 'notanemail' } })
		fireEvent.change(passwordInput, { target: { value: 'validpassword' } })

		// Submit form directly to bypass HTML5 validation
		fireEvent.submit(form)

		// Validation error should appear
		await waitFor(() => {
			expect(screen.getByText(/Please enter a valid email address/i)).toBeDefined()
		})
	})

	test('shows validation error for weak password', async () => {
		await renderLoginModal()

		// Switch to register
		fireEvent.click(screen.getByText('Sign up'))

		// Wait for register mode to be active
		const submitButton = await screen.findByRole('button', { name: /Create Account/i })

		const nameInput = screen.getByLabelText(/Name/i)
		const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement
		const passwordInput = screen.getByPlaceholderText('Enter your password')
		const form = emailInput.closest('form')!

		// Fill in form with weak password
		fireEvent.change(nameInput, { target: { value: 'Test User' } })
		fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
		fireEvent.change(passwordInput, { target: { value: '123' } })

		// Submit form directly to bypass HTML5 validation
		fireEvent.submit(form)

		// Validation error should appear
		await waitFor(() => {
			expect(screen.getByText(/Password must be at least 6 characters/i)).toBeDefined()
		})
	})

	test('toggles password visibility', async () => {
		await renderLoginModal()

		const passwordInput = screen.getByPlaceholderText('Enter your password') as HTMLInputElement
		const toggleButton = screen.getByRole('button', { name: 'Toggle password visibility' })

		expect(passwordInput.type).toBe('password')

		fireEvent.click(toggleButton)
		expect(passwordInput.type).toBe('text')

		fireEvent.click(toggleButton)
		expect(passwordInput.type).toBe('password')
	})

	test('submits login form', async () => {
		await renderLoginModal()

		// Mock successful login response
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				user: { id: 1, email: 'admin@example.com', name: 'Admin' },
			}),
		} as Response)

		const emailInput = screen.getByLabelText(/Username or Email/i) as HTMLInputElement
		const passwordInput = screen.getByPlaceholderText('Enter your password')
		const form = emailInput.closest('form')!

		fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
		fireEvent.change(passwordInput, { target: { value: 'admin123' } })

		// Submit form directly to bypass HTML5 validation
		fireEvent.submit(form)

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				'/api/auth/login',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
				})
			)
		})
	})

	test('displays error message on failed login', async () => {
		await renderLoginModal()

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
			expect(screen.getByText(/Invalid email or password/i)).toBeDefined()
		})
	})
})
