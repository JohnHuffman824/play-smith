import { db } from '../connection'
import type { User } from '../types'

const USER_CREATE_FAILED = 'Failed to create user'

export class UserRepository {
	// Persists a user and returns DB defaults in one round trip
	async create(data: {
		email: string
		name: string
		password_hash: string
	}): Promise<User> {
		const [user] = await db<User[]>`
			INSERT INTO users (email, name, password_hash)
			VALUES (${data.email}, ${data.name}, ${data.password_hash})
			RETURNING *
		`

		if (!user) {
			throw new Error(USER_CREATE_FAILED)
		}
		return user
	}

	// Retrieves a user by primary key or null when missing
	async findById(id: number): Promise<User | null> {
		const [user] = await db<User[]>`
			SELECT * FROM users WHERE id = ${id}
		`

		return user ?? null
	}

	// Retrieves a user by unique email or null when missing
	async findByEmail(email: string): Promise<User | null> {
		const [user] = await db<User[]>`
			SELECT * FROM users WHERE email = ${email}
		`

		return user ?? null
	}

	// Lists users newest first
	async list(): Promise<User[]> {
		return await db<User[]>`
			SELECT * FROM users ORDER BY created_at DESC
		`
	}
}
