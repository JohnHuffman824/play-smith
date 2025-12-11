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
			<div className='flex items-center justify-center h-screen'>
				<div className='text-lg'>Loading...</div>
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
