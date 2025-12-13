import { useNavigate } from 'react-router-dom'
import './not-found-page.css'

export function NotFoundPage() {
	const navigate = useNavigate()

	return (
		<div className="not-found-page">
			<h1 className="not-found-page-title">404</h1>
			<p className="not-found-page-message">Page not found</p>
			<button
				onClick={() => navigate('/playbooks')}
				className="not-found-page-button"
			>
				Return to Playbooks
			</button>
		</div>
	)
}
