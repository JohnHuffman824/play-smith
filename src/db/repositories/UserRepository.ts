import { db } from '../connection';
import type { User } from '../types';

export class UserRepository {
	async create(data: { email: string; name: string }): Promise<User> {
		const [result] = await db<any[]>`
			INSERT INTO users (email, name)
			VALUES (${data.email}, ${data.name})
		`;

		const [user] = await db<User[]>`
			SELECT * FROM users WHERE id = ${result.insertId}
		`;

		return user;
	}

	async findById(id: number): Promise<User | null> {
		const [user] = await db<User[]>`
			SELECT * FROM users WHERE id = ${id}
		`;

		return user || null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const [user] = await db<User[]>`
			SELECT * FROM users WHERE email = ${email}
		`;

		return user || null;
	}

	async list(): Promise<User[]> {
		return await db<User[]>`
			SELECT * FROM users ORDER BY created_at DESC
		`;
	}
}
