import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
	const navigate = useNavigate()

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background">
			<h1 className="text-6xl font-bold mb-4">404</h1>
			<p className="text-2xl text-muted-foreground mb-8">Page not found</p>
			<button
				onClick={() => navigate('/playbooks')}
				className="px-6 py-2 bg-action-button text-action-button-foreground rounded-lg hover:bg-action-button/90 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
			>
				Return to Playbooks
			</button>
		</div>
	)
}
