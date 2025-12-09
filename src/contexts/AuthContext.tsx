import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react'
import type { ReactNode } from 'react'
import type {
	AuthUser,
	AuthState,
	LoginCredentials,
	RegisterData,
} from '../types/auth.types'

interface AuthContextValue extends AuthState {
	login: (credentials: LoginCredentials) => Promise<void>
	register: (data: RegisterData) => Promise<void>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
	children: ReactNode
}

// Provides authentication state and actions to the app
export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const isAuthenticated = user !== null

	// Check for existing session on mount
	useEffect(() => {
		checkSession()
	}, [])

	// Validates existing session cookie with server
	async function checkSession(): Promise<void> {
		try {
			const response = await fetch('/api/auth/me', {
				credentials: 'include',
			})
			const data = await response.json()
			setUser(data.user)
		} catch {
			setUser(null)
		} finally {
			setIsLoading(false)
		}
	}

	// Authenticates user with email and password
	const login = useCallback(
		async (credentials: LoginCredentials): Promise<void> => {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(credentials),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error ?? 'Login failed')
			}

			const data = await response.json()
			setUser(data.user)
		},
		[]
	)

	// Creates new user account and logs in
	const register = useCallback(
		async (data: RegisterData): Promise<void> => {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(data),
			})

			if (!response.ok) {
				const resData = await response.json()
				throw new Error(resData.error ?? 'Registration failed')
			}

			const resData = await response.json()
			setUser(resData.user)
		},
		[]
	)

	// Ends user session and clears state
	const logout = useCallback(async (): Promise<void> => {
		await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include',
		})
		setUser(null)
	}, [])

	const value: AuthContextValue = {
		user,
		isLoading,
		isAuthenticated,
		login,
		register,
		logout,
	}

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}

// Hook to access auth context - throws if used outside provider
export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}
