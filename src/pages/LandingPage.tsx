import { Link } from 'react-router-dom'

export function LandingPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background">
			<h1 className="text-4xl font-bold mb-4">Play Smith</h1>
			<p className="text-xl text-muted-foreground mb-8">
				Create and manage your football playbooks
			</p>
			<Link
				to="/login"
				className="px-6 py-3 bg-action-button text-action-button-foreground rounded-lg hover:bg-action-button/90 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
			>
				Get Started
			</Link>
		</div>
	)
}
