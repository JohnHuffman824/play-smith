import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { LoginModal } from '../components/auth/LoginModal'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user } = useAuth()

	// Redirect if already logged in
	useEffect(() => {
		if (user) {
			const returnUrl = searchParams.get('returnUrl') || '/playbooks'
			navigate(returnUrl, { replace: true })
		}
	}, [user, navigate, searchParams])

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<LoginModal />
		</div>
	)
}
