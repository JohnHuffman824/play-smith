import { Link } from 'react-router-dom'

export function LandingPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<h1 className="text-4xl font-bold mb-4">Play Smith</h1>
			<p className="text-xl text-gray-600 mb-8">
				Create and manage your football playbooks
			</p>
			<Link
				to="/login"
				className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Get Started
			</Link>
		</div>
	)
}
