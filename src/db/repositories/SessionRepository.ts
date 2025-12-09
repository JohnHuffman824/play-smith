import { db } from '../connection'
import type { Session } from '../types'

const SESSION_CREATE_FAILED = 'Failed to create session'
const SESSION_DURATION_DAYS = 7

export class SessionRepository {
	// Creates a new session with 7-day expiration
	async create(userId: number, token: string): Promise<Session> {
		const expiresAt = new Date()
		expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

		const [session] = await db<Session[]>`
			INSERT INTO sessions (user_id, token, expires_at)
			VALUES (${userId}, ${token}, ${expiresAt})
			RETURNING *
		`

		if (!session) {
			throw new Error(SESSION_CREATE_FAILED)
		}
		return session
	}

	// Finds a valid (non-expired) session by token
	async findValidByToken(token: string): Promise<Session | null> {
		const [session] = await db<Session[]>`
			SELECT * FROM sessions
			WHERE token = ${token}
			AND expires_at > CURRENT_TIMESTAMP
		`

		return session ?? null
	}

	// Deletes a session by token (logout)
	async deleteByToken(token: string): Promise<void> {
		await db`DELETE FROM sessions WHERE token = ${token}`
	}

	// Deletes all sessions for a user (force logout everywhere)
	async deleteAllForUser(userId: number): Promise<void> {
		await db`DELETE FROM sessions WHERE user_id = ${userId}`
	}

	// Cleans up expired sessions (run periodically)
	async deleteExpired(): Promise<number> {
		const result = await db`
			DELETE FROM sessions
			WHERE expires_at < CURRENT_TIMESTAMP
		`
		return result.count
	}
}
