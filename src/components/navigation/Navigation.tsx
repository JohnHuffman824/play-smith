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
		<nav className="bg-card shadow-sm border-b border-border">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center space-x-8">
						<Link to="/" className="text-xl font-bold">
							Play Smith
						</Link>
						<Link
							to="/playbooks"
							className="text-foreground hover:text-foreground/80 transition-colors duration-200"
						>
							Playbooks
						</Link>
					</div>
					<div className="flex items-center space-x-4">
						<span className="text-foreground">{user.name}</span>
						<button
							onClick={handleLogout}
							className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>
	)
}
