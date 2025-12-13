import { Link } from 'react-router-dom'
import './landing-page.css'

export function LandingPage() {
	return (
		<div className="landing-page">
			<h1 className="landing-page-title">Play Smith</h1>
			<p className="landing-page-description">
				Create and manage your football playbooks
			</p>
			<Link
				to="/login"
				className="landing-page-button"
			>
				Get Started
			</Link>
		</div>
	)
}
