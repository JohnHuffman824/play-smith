import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider'
import { SettingsProvider } from './contexts/SettingsContext'
import { AuthProvider } from './contexts/AuthContext'
import { TeamProvider } from './contexts/TeamContext'
import { routes } from './router/routes'
import './index.css'

const router = createBrowserRouter(routes)

export default function App() {
	return (
		<QueryProvider>
			<SettingsProvider>
				<AuthProvider>
					<TeamProvider>
						<RouterProvider router={router} />
					</TeamProvider>
				</AuthProvider>
			</SettingsProvider>
		</QueryProvider>
	)
}
