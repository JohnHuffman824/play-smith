import { useState, useEffect } from 'react'

export interface User {
	id: number
	email: string
	name: string
}

export interface UseAuthResult {
	user: User | null
	loading: boolean
	logout: () => void
}

export function useAuth(): UseAuthResult {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		checkAuth()
	}, [])

	async function checkAuth() {
		try {
			const response = await fetch('/api/auth/me')

			if (response.ok) {
				const userData = await response.json()
				setUser(userData)
			} else {
				setUser(null)
			}
		} catch (error) {
			console.error('Auth check failed:', error)
			setUser(null)
		} finally {
			setLoading(false)
		}
	}

	async function logout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' })
			setUser(null)
		} catch (error) {
			console.error('Logout failed:', error)
		}
	}

	return { user, loading, logout }
}
