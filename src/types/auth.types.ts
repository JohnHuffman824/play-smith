export interface AuthUser {
	id: number
	email: string
	name: string
}

export interface AuthState {
	user: AuthUser | null
	isLoading: boolean
	isAuthenticated: boolean
}

export interface LoginCredentials {
	email: string
	password: string
}

export interface RegisterData {
	email: string
	name: string
	password: string
}
