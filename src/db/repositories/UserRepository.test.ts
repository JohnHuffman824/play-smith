import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { UserRepository } from './UserRepository';
import { db } from '../connection';

describe('UserRepository', () => {
	const repo = new UserRepository();
	let testUserId: number;

	afterAll(async () => {
		// Cleanup
		if (testUserId) {
			await db`DELETE FROM users WHERE id = ${testUserId}`;
		}
	});

	test('create user', async () => {
		const user = await repo.create({
			email: 'test@example.com',
			name: 'Test User',
		});

		expect(user.id).toBeGreaterThan(0);
		expect(user.email).toBe('test@example.com');
		expect(user.name).toBe('Test User');

		testUserId = user.id;
	});

	test('find user by id', async () => {
		const user = await repo.findById(testUserId);

		expect(user).toBeDefined();
		expect(user?.email).toBe('test@example.com');
	});

	test('find user by email', async () => {
		const user = await repo.findByEmail('test@example.com');

		expect(user).toBeDefined();
		expect(user?.id).toBe(testUserId);
	});

	test('find non-existent user returns null', async () => {
		const user = await repo.findById(999999);
		expect(user).toBeNull();
	});
});
