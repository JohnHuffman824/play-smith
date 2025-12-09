import { sql } from 'bun';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

export const db = sql(process.env.DATABASE_URL);

export async function testConnection(): Promise<boolean> {
	try {
		await db`SELECT 1`;
		return true;
	} catch (error) {
		console.error('Database connection failed:', error);
		return false;
	}
}
