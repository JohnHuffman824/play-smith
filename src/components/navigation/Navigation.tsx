import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Navigation() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	const handleLogout = () => {
		logout()
		navigate('/login')
	}

	if (!user) {
		return null
	}

	return (
		<nav className="bg-white shadow-sm border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center space-x-8">
						<Link to="/" className="text-xl font-bold">
							Play Smith
						</Link>
						<Link
							to="/playbooks"
							className="text-gray-700 hover:text-gray-900"
						>
							Playbooks
						</Link>
					</div>
					<div className="flex items-center space-x-4">
						<span className="text-gray-700">{user.name}</span>
						<button
							onClick={handleLogout}
							className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>
	)
}
