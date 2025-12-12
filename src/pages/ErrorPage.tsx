import { useNavigate, useRouteError } from 'react-router-dom'

export function ErrorPage() {
	const error = useRouteError() as Error
	const navigate = useNavigate()

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background">
			<h1 className="text-4xl font-bold mb-4">Oops!</h1>
			<p className="text-xl text-muted-foreground mb-2">Something went wrong</p>
			<p className="text-muted-foreground mb-8">{error?.message || 'Unknown error'}</p>
			<div className="flex gap-4">
				<button
					onClick={() => navigate(-1)}
					className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
				>
					Go Back
				</button>
				<button
					onClick={() => navigate('/playbooks')}
					className="px-6 py-2 bg-action-button text-action-button-foreground rounded-lg hover:bg-action-button/90 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
				>
					Return to Playbooks
				</button>
			</div>
		</div>
	)
}
