import { serve, Server } from 'bun'
import index from '../../src/index.html'
import { usersAPI, getUserById } from '../../src/api/users'
import { authAPI } from '../../src/api/auth'
import { teamsAPI } from '../../src/api/teams'
import { playbooksAPI } from '../../src/api/playbooks'
import { playbookSharesAPI } from '../../src/api/playbook-shares'
import { foldersAPI } from '../../src/api/folders'
import { sectionsAPI } from '../../src/api/sections'
import { playsAPI } from '../../src/api/plays'

let testServer: Server | null = null

/**
 * Start a test server on a random available port
 * Returns the server instance and base URL
 */
export async function startTestServer(): Promise<{
	server: Server
	url: string
}> {
	// If server is already running, return existing instance
	if (testServer) {
		return {
			server: testServer,
			url: testServer.url.toString().replace(/\/$/, '')
		}
	}

	testServer = serve({
		port: 0, // Use random available port
		routes: {
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
			'/api/playbooks/:id/shares': {
				GET: playbookSharesAPI.list,
				POST: playbookSharesAPI.create,
			},
			'/api/playbooks/:id/shares/:teamId': {
				DELETE: playbookSharesAPI.delete,
			},
			'/api/playbooks/:id/star': {
				PUT: playbooksAPI.toggleStar,
			},
			'/api/playbooks/:id/restore': {
				PUT: playbooksAPI.restore,
			},
			'/api/playbooks/:id/permanent': {
				DELETE: playbooksAPI.permanentDelete,
			},
			'/api/trash': {
				DELETE: playbooksAPI.emptyTrash,
			},
			'/api/playbooks/:id': {
				GET: playbooksAPI.get,
				PUT: playbooksAPI.update,
				DELETE: playbooksAPI.delete,
			},

			'/api/folders': {
				GET: foldersAPI.list,
				POST: foldersAPI.create,
			},
			'/api/folders/:id': {
				PUT: foldersAPI.update,
				DELETE: foldersAPI.delete,
			},

			'/api/playbooks/:playbookId/sections': {
				GET: sectionsAPI.list,
				POST: sectionsAPI.create,
			},
			'/api/sections/:sectionId': {
				PUT: sectionsAPI.update,
				DELETE: sectionsAPI.delete,
			},

			'/api/playbooks/:playbookId/plays': {
				GET: playsAPI.list,
				POST: playsAPI.create,
			},
			'/api/plays/:playId': {
				GET: playsAPI.get,
				PUT: playsAPI.update,
				DELETE: playsAPI.delete,
			},
			'/api/plays/:playId/duplicate': {
				POST: playsAPI.duplicate,
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

			'/*': index,
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
 * NOTE: In test suite, we keep the server running across all test files
 * It will be cleaned up when the test process exits
 */
export async function stopTestServer(): Promise<void> {
	// Don't stop the server - let it persist across test files
	// The server will be cleaned up when the test process exits
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
