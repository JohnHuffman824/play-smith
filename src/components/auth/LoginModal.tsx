import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../ui/input'

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
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div
					className="bg-white rounded-3xl shadow-2xl max-w-md w-full
						overflow-hidden animate-modal-in"
				>
					{/* Header */}
					<div
						className="relative bg-gradient-to-br from-blue-50
							to-blue-100 p-8 pb-12"
					>
						<div className="flex items-center gap-3 mb-3">
							<div
								className="w-12 h-12 rounded-2xl bg-gradient-to-br
									from-blue-600 to-blue-400 flex items-center
									justify-center shadow-lg"
							>
								<span className="text-white text-xl font-bold">
									PS
								</span>
							</div>
							<h2 className="text-2xl text-gray-800 font-semibold">
								Play Smith
							</h2>
						</div>

						<p className="text-gray-600 text-sm">
							{isLogin
								? 'Sign in to access your playbooks'
								: 'Create an account to get started'}
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="p-8 pt-6">
						{displayError && (
							<div
								className="mb-4 p-3 bg-red-50 border border-red-200
									rounded-xl text-red-600 text-sm"
							>
								{displayError}
							</div>
						)}

						{/* Name Input (register only) */}
						{!isLogin && (
							<div className="mb-4">
								<label
									htmlFor="name"
									className="block text-sm text-gray-700 mb-2
										font-medium"
								>
									Name
								</label>
								<div className="relative">
									<User
										className="absolute left-4 top-1/2
											-translate-y-1/2 w-5 h-5 text-gray-400"
									/>
									<Input
										id="name"
										type="text"
										value={name}
										onChange={e => setName(e.target.value)}
										placeholder="Your name"
										className="h-12 pl-12 pr-4 rounded-2xl"
										required={!isLogin}
									/>
								</div>
							</div>
						)}

						{/* Email Input */}
						<div className="mb-4">
							<label
								htmlFor="email"
								className="block text-sm text-gray-700 mb-2 font-medium"
							>
								{isLogin ? 'Username or Email' : 'Email'}
							</label>
							<div className="relative">
								<Mail
									className="absolute left-4 top-1/2 -translate-y-1/2
										w-5 h-5 text-gray-400"
								/>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									placeholder={isLogin ? 'JohnDoe@gmail.com' : 'coach@example.com'}
									className="h-12 pl-12 pr-4 rounded-2xl"
									required
								/>
							</div>
						</div>

						{/* Password Input */}
						<div className="mb-6">
							<label
								htmlFor="password"
								className="block text-sm text-gray-700 mb-2 font-medium"
							>
								Password
							</label>
							<div className="relative">
								<Lock
									className="absolute left-4 top-1/2 -translate-y-1/2
										w-5 h-5 text-gray-400"
								/>
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={e => setPassword(e.target.value)}
									placeholder="Enter your password"
									className="h-12 pl-12 pr-12 rounded-2xl"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-4 top-1/2 -translate-y-1/2
										text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
									aria-label="Toggle password visibility"
								>
									{showPassword
										? <EyeOff className="w-5 h-5" />
										: <Eye className="w-5 h-5" />
									}
								</button>
							</div>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full py-3.5 bg-blue-500 hover:bg-blue-600
								text-white rounded-2xl font-semibold transition-all
								hover:shadow-lg disabled:opacity-50 cursor-pointer
								disabled:cursor-not-allowed mb-4"
						>
							{isSubmitting
								? 'Please wait...'
								: isLogin ? 'Sign In' : 'Create Account'
							}
						</button>

						{/* Divider */}
						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-200" />
							</div>
							<div className="relative flex justify-center">
								<span className="px-4 bg-white text-sm text-gray-500">
									or
								</span>
							</div>
						</div>

						{/* Switch Mode Link */}
						<p className="text-center text-sm text-gray-600">
							{isLogin
								? "Don't have an account? "
								: 'Already have an account? '
							}
							<button
								type="button"
								onClick={switchMode}
								className="text-blue-600 hover:text-blue-700
									font-semibold transition-colors cursor-pointer"
							>
								{isLogin ? 'Sign up' : 'Sign in'}
							</button>
						</p>
					</form>
				</div>
			</div>
		</>
	)
}
