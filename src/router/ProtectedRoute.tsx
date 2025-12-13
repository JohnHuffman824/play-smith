import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type ProtectedRouteProps = {
	children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, isLoading } = useAuth()
	const location = useLocation()

	if (isLoading) {
		return (
			<div className="protected-route-loading">
				<div className="protected-route-spinner" />
				<div className="protected-route-loading-text">Loading...</div>
			</div>
		)
	}

	if (!user) {
		// Redirect to login with return URL
		const returnUrl = encodeURIComponent(location.pathname + location.search)
		return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />
	}

	return <>{children}</>
}
