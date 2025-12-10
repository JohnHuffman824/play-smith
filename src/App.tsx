import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { TeamProvider } from './contexts/TeamContext'
import { PlaybookProvider } from './contexts/PlaybookContext'
import { routes } from './router/routes'
import './index.css'

const router = createBrowserRouter(routes)

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<TeamProvider>
					<PlaybookProvider>
						<RouterProvider router={router} />
					</PlaybookProvider>
				</TeamProvider>
			</AuthProvider>
		</ThemeProvider>
	)
}
