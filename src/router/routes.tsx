import type { RouteObject } from 'react-router-dom'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { PlaybookManagerPage } from '../pages/PlaybookManagerPage'
import { PlaybookEditorPage } from '../pages/PlaybookEditorPage'
import { PlayEditorPage } from '../pages/PlayEditorPage'
import { PlayAnimationPage } from '../pages/PlayAnimationPage'
import { ErrorPage } from '../pages/ErrorPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'

export const routes: RouteObject[] = [
	{
		path: '/',
		element: <LandingPage />,
		errorElement: <ErrorPage />
	},
	{
		path: '/login',
		element: <LoginPage />,
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks',
		element: (
			<ProtectedRoute>
				<PlaybookManagerPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks/:playbookId',
		element: (
			<ProtectedRoute>
				<PlaybookEditorPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks/:playbookId/play/:playId',
		element: (
			<ProtectedRoute>
				<PlayEditorPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '/playbooks/:playbookId/animate/:playId',
		element: (
			<ProtectedRoute>
				<PlayAnimationPage />
			</ProtectedRoute>
		),
		errorElement: <ErrorPage />
	},
	{
		path: '*',
		element: <NotFoundPage />
	}
]
