import { useNavigate, useSearchParams } from 'react-router-dom'

export function LoginPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()

		// TODO: Implement actual login logic when auth is ready
		// For now, just redirect to return URL or playbooks
		const returnUrl = searchParams.get('returnUrl') || '/playbooks'
		navigate(returnUrl)
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50">
			<div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
				<h1 className="text-2xl font-bold mb-6">Login</h1>
				<form onSubmit={handleLogin}>
					<div className="mb-4">
						<label className="block text-sm font-medium mb-2">Email</label>
						<input
							type="email"
							className="w-full px-3 py-2 border rounded-lg"
							placeholder="you@example.com"
						/>
					</div>
					<div className="mb-6">
						<label className="block text-sm font-medium mb-2">Password</label>
						<input
							type="password"
							className="w-full px-3 py-2 border rounded-lg"
							placeholder="••••••••"
						/>
					</div>
					<button
						type="submit"
						className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Sign In
					</button>
				</form>
				<p className="mt-4 text-sm text-gray-600">
					Auth integration coming soon
				</p>
			</div>
		</div>
	)
}
