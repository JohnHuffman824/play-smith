import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
	const navigate = useNavigate()

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<h1 className="text-6xl font-bold mb-4">404</h1>
			<p className="text-2xl text-gray-600 mb-8">Page not found</p>
			<button
				onClick={() => navigate('/playbooks')}
				className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Return to Playbooks
			</button>
		</div>
	)
}
