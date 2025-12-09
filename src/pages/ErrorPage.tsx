import { useNavigate, useRouteError } from 'react-router-dom'

export function ErrorPage() {
	const error = useRouteError() as Error
	const navigate = useNavigate()

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
			<h1 className="text-4xl font-bold mb-4">Oops!</h1>
			<p className="text-xl text-gray-600 mb-2">Something went wrong</p>
			<p className="text-gray-500 mb-8">{error?.message || 'Unknown error'}</p>
			<div className="flex gap-4">
				<button
					onClick={() => navigate(-1)}
					className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
				>
					Go Back
				</button>
				<button
					onClick={() => navigate('/playbooks')}
					className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					Return to Playbooks
				</button>
			</div>
		</div>
	)
}
