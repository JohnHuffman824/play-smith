import { describe, test, expect } from 'bun:test';
import { testConnection } from './connection';

describe('Database Connection', () => {
	test('should connect to database', async () => {
		const connected = await testConnection();
		expect(connected).toBe(true);
	});
});
