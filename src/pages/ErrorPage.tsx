import { useNavigate, useRouteError } from 'react-router-dom'
import './error-page.css'

export function ErrorPage() {
	const error = useRouteError() as Error
	const navigate = useNavigate()

	return (
		<div className="error-page">
			<h1 className="error-page-title">Oops!</h1>
			<p className="error-page-message">Something went wrong</p>
			<p className="error-page-details">{error?.message || 'Unknown error'}</p>
			<div className="error-page-actions">
				<button
					onClick={() => navigate(-1)}
					className="error-page-button error-page-button-secondary"
				>
					Go Back
				</button>
				<button
					onClick={() => navigate('/playbooks')}
					className="error-page-button error-page-button-primary"
				>
					Return to Playbooks
				</button>
			</div>
		</div>
	)
}
