import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../ui/input'
import {
	Dialog,
	DialogContent,
} from '../ui/dialog'
import './login-modal.css'

type AuthMode = 'login' | 'register'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Minimum password length requirement
const MIN_PASSWORD_LENGTH = 6

// Validates email format
function isValidEmail(email: string): boolean {
	return EMAIL_REGEX.test(email)
}

// Validates password strength
function isValidPassword(password: string): boolean {
	return password.length >= MIN_PASSWORD_LENGTH
}

// Modal for user login and registration
export function LoginModal() {
	const { login, register } = useAuth()

	const [mode, setMode] = useState<AuthMode>('login')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const [validationError, setValidationError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Validates form before submission
	function validateForm(): boolean {
		setValidationError('')

		if (mode === 'register') {
			if (!isValidEmail(email)) {
				setValidationError('Please enter a valid email address')
				return false
			}

			if (!isValidPassword(password)) {
				setValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
				return false
			}

			if (!name.trim()) {
				setValidationError('Name is required')
				return false
			}
		}

		return true
	}

	// Handles form submission for both login and register modes
	async function handleSubmit(e: React.FormEvent): Promise<void> {
		e.preventDefault()
		setError('')
		setValidationError('')

		if (!validateForm()) {
			return
		}

		setIsSubmitting(true)

		try {
			if (mode === 'login') {
				await login({ email, password })
			} else {
				await register({ email, name, password })
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Switches between login and register modes
	function switchMode(): void {
		setMode(mode === 'login' ? 'register' : 'login')
		setError('')
		setValidationError('')
	}

	const isLogin = mode === 'login'
	const displayError = validationError || error

	return (
		<Dialog open={true}>
			<DialogContent className="login-modal" hideClose>
				{/* Header */}
				<div className="login-modal-header">
					<div className="login-modal-header-content">
						<div className="login-modal-logo">
							<span>PS</span>
						</div>
						<h2 className="login-modal-title">
							Play Smith
						</h2>
					</div>

					<p className="login-modal-subtitle">
						{isLogin
							? 'Sign in to access your playbooks'
							: 'Create an account to get started'}
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="login-modal-form">
					{displayError && (
						<div className="login-modal-error">
							{displayError}
						</div>
					)}

					{/* Name Input (register only) */}
					{!isLogin && (
						<div className="login-modal-form-group">
							<label htmlFor="name" className="login-modal-label">
								Name
							</label>
							<div className="login-modal-input-wrapper">
								<User className="login-modal-input-icon" />
								<Input
									id="name"
									type="text"
									value={name}
									onChange={e => setName(e.target.value)}
									placeholder="Your name"
									required={!isLogin}
								/>
							</div>
						</div>
					)}

					{/* Email Input */}
					<div className="login-modal-form-group">
						<label htmlFor="email" className="login-modal-label">
							{isLogin ? 'Username or Email' : 'Email'}
						</label>
						<div className="login-modal-input-wrapper">
							<Mail className="login-modal-input-icon" />
							<Input
								id="email"
								type={isLogin ? 'text' : 'email'}
								value={email}
								onChange={e => setEmail(e.target.value)}
								placeholder={isLogin ? 'JohnDoe@gmail.com' : 'coach@example.com'}
								required
							/>
						</div>
					</div>

					{/* Password Input */}
					<div className="login-modal-form-group" style={{ marginBottom: '1.5rem' }}>
						<label htmlFor="password" className="login-modal-label">
							Password
						</label>
						<div className="login-modal-input-wrapper has-toggle">
							<Lock className="login-modal-input-icon" />
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={e => setPassword(e.target.value)}
								placeholder="Enter your password"
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="login-modal-password-toggle"
								aria-label="Toggle password visibility"
							>
								{showPassword
									? <EyeOff />
									: <Eye />
								}
							</button>
						</div>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isSubmitting}
						className="login-modal-submit"
					>
						{isSubmitting
							? 'Please wait...'
							: isLogin ? 'Sign In' : 'Create Account'
						}
					</button>

					{/* Divider */}
					<div className="login-modal-divider">
						<div className="login-modal-divider-text">
							<span>or</span>
						</div>
					</div>

					{/* Switch Mode Link */}
					<p className="login-modal-switch">
						{isLogin
							? "Don't have an account? "
							: 'Already have an account? '
						}
						<button
							type="button"
							onClick={switchMode}
							className="login-modal-switch-button"
						>
							{isLogin ? 'Sign up' : 'Sign in'}
						</button>
					</p>
				</form>
			</DialogContent>
		</Dialog>
	)
}
