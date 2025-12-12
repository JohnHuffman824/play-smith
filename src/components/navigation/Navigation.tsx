import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './navigation.css'

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
		<nav className="navigation">
			<div className="navigation-inner">
				<div className="navigation-content">
					<div className="navigation-left">
						<Link to="/" className="navigation-logo">
							Play Smith
						</Link>
						<Link to="/playbooks" className="navigation-link">
							Playbooks
						</Link>
					</div>
					<div className="navigation-right">
						<span className="navigation-username">{user.name}</span>
						<button onClick={handleLogout} className="navigation-logout">
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>
	)
}
