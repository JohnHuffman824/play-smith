import { UserRepository } from '../db/repositories/UserRepository'
import { SessionRepository } from '../db/repositories/SessionRepository'
import { TeamRepository } from '../db/repositories/TeamRepository'
import { AuthService } from '../services/AuthService'

const userRepo = new UserRepository()
const sessionRepo = new SessionRepository()
const teamRepo = new TeamRepository()
const authService = new AuthService()

const SESSION_COOKIE_NAME = 'session_token'
const INVALID_CREDENTIALS = 'Invalid email or password'
const EMAIL_EXISTS = 'Email already registered'

// Parses session token from cookie header
function getSessionToken(req: Request): string | null {
	const cookies = req.headers.get('cookie') ?? ''
	const match = cookies.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))
	return match?.[1] ?? null
}

// Creates HTTP-only session cookie
function createSessionCookie(token: string, maxAge: number): string {
	return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/; ` +
		`Max-Age=${maxAge}; SameSite=Strict`
}

// Creates cookie that expires the session
function createExpiredCookie(): string {
	return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`
}

export const authAPI = {
	// POST /api/auth/login - Authenticate user and create session
	async login(req: Request): Promise<Response> {
		const body = await req.json()
		const { email, password } = body

		if (!email || !password) {
			return Response.json(
				{ error: 'Email and password are required' },
				{ status: 400 }
			)
		}

		const user = await userRepo.findByEmail(email)
		if (!user) {
			return Response.json(
				{ error: INVALID_CREDENTIALS },
				{ status: 401 }
			)
		}

		const valid = await authService.verifyPassword(
			password,
			user.password_hash
		)
		if (!valid) {
			return Response.json(
				{ error: INVALID_CREDENTIALS },
				{ status: 401 }
			)
		}

		const token = authService.generateSessionToken()
		await sessionRepo.create(user.id, token)

		const sevenDaysInSeconds = 7 * 24 * 60 * 60

		return Response.json(
			{ user: { id: user.id, email: user.email, name: user.name } },
			{
				status: 200,
				headers: {
					'Set-Cookie': createSessionCookie(token, sevenDaysInSeconds),
				},
			}
		)
	},

	// POST /api/auth/register - Create new user account
	async register(req: Request): Promise<Response> {
		const body = await req.json()
		const { email, name, password } = body

		if (!email || !name || !password) {
			return Response.json(
				{ error: 'Email, name, and password are required' },
				{ status: 400 }
			)
		}

		const existing = await userRepo.findByEmail(email)
		if (existing) {
			return Response.json(
				{ error: EMAIL_EXISTS },
				{ status: 409 }
			)
		}

		const passwordHash = await authService.hashPassword(password)
		const user = await userRepo.create({
			email,
			name,
			password_hash: passwordHash,
		})

		// Create default "My Team" for new user
		const defaultTeam = await teamRepo.create({ name: 'My Team' })
		await teamRepo.addMember({
			team_id: defaultTeam.id,
			user_id: user.id,
			role: 'owner'
		})

		const token = authService.generateSessionToken()
		await sessionRepo.create(user.id, token)

		const sevenDaysInSeconds = 7 * 24 * 60 * 60

		return Response.json(
			{ user: { id: user.id, email: user.email, name: user.name } },
			{
				status: 201,
				headers: {
					'Set-Cookie': createSessionCookie(token, sevenDaysInSeconds),
				},
			}
		)
	},

	// POST /api/auth/logout - Destroy session
	async logout(req: Request): Promise<Response> {
		const token = getSessionToken(req)
		if (token) {
			await sessionRepo.deleteByToken(token)
		}

		return Response.json(
			{ success: true },
			{
				status: 200,
				headers: { 'Set-Cookie': createExpiredCookie() },
			}
		)
	},

	// GET /api/auth/me - Get current user from session
	async me(req: Request): Promise<Response> {
		const token = getSessionToken(req)
		if (!token) {
			return Response.json({ user: null }, { status: 200 })
		}

		const session = await sessionRepo.findValidByToken(token)
		if (!session) {
			return Response.json(
				{ user: null },
				{
					status: 200,
					headers: { 'Set-Cookie': createExpiredCookie() },
				}
			)
		}

		const user = await userRepo.findById(session.user_id)
		if (!user) {
			return Response.json({ user: null }, { status: 200 })
		}

		return Response.json({
			user: { id: user.id, email: user.email, name: user.name },
		})
	},
}
