import { serve, Server } from 'bun'
import index from '../../src/index.html'
import { usersAPI, getUserById } from '../../src/api/users'
import { authAPI } from '../../src/api/auth'
import { teamsAPI } from '../../src/api/teams'
import { playbooksAPI } from '../../src/api/playbooks'
import { sectionsAPI } from '../../src/api/sections'

let testServer: Server | null = null

/**
 * Start a test server on a random available port
 * Returns the server instance and base URL
 */
export async function startTestServer(): Promise<{
	server: Server
	url: string
}> {
	if (testServer) {
		throw new Error('Test server already running')
	}

	testServer = serve({
		port: 0, // Use random available port
		routes: {
			'/*': index,

			'/api/auth/login': {
				POST: authAPI.login,
			},
			'/api/auth/register': {
				POST: authAPI.register,
			},
			'/api/auth/logout': {
				POST: authAPI.logout,
			},
			'/api/auth/me': {
				GET: authAPI.me,
			},

			'/api/users': usersAPI,
			'/api/users/:id': getUserById,

			'/api/teams': {
				GET: teamsAPI.list,
			},

			'/api/playbooks': {
				GET: playbooksAPI.list,
				POST: playbooksAPI.create,
			},
			'/api/playbooks/:id': {
				GET: playbooksAPI.get,
				PUT: playbooksAPI.update,
				DELETE: playbooksAPI.delete,
			},

			'/api/playbooks/:playbookId/sections': {
				GET: sectionsAPI.list,
				POST: sectionsAPI.create,
			},
			'/api/sections/:sectionId': {
				PUT: sectionsAPI.update,
				DELETE: sectionsAPI.delete,
			},

			'/api/hello': {
				async GET(req) {
					return Response.json({
						message: 'Hello, world!',
						method: 'GET',
					})
				},
				async PUT(req) {
					return Response.json({
						message: 'Hello, world!',
						method: 'PUT',
					})
				},
			},

			'/api/hello/:name': async req => {
				const name = req.params.name
				return Response.json({
					message: `Hello, ${name}!`,
				})
			},
		},

		development: false, // Disable HMR in tests
	})

	return {
		server: testServer,
		url: testServer.url.toString().replace(/\/$/, ''), // Remove trailing slash
	}
}

/**
 * Stop the test server if running
 */
export async function stopTestServer(): Promise<void> {
	if (testServer) {
		testServer.stop()
		testServer = null
	}
}

/**
 * Get the current test server URL
 * Throws if no server is running
 */
export function getTestServerUrl(): string {
	if (!testServer) {
		throw new Error('Test server not running')
	}
	return testServer.url.toString().replace(/\/$/, '')
}
