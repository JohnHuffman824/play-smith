/**
 * Smart database connection that automatically switches based on environment:
 * - Test environment (NODE_ENV=test or BUN_ENV=test): Uses in-memory SQLite
 * - Production/development: Uses PostgreSQL
 *
 * This allows tests to run fast with isolated in-memory databases while
 * production code uses the real PostgreSQL database.
 */

const isTestEnv =
	process.env.NODE_ENV === 'test' ||
	process.env.BUN_ENV === 'test' ||
	Bun.env.NODE_ENV === 'test' ||
	Bun.env.BUN_ENV === 'test'

let _db: any
let _testConnection: any

if (isTestEnv) {
	// Use SQLite for tests
	const sqlite = require('./connection.sqlite')
	_db = sqlite.db
	_testConnection = sqlite.testConnection
} else {
	// Use PostgreSQL for production/development
	const postgres = require('./connection.postgres')
	_db = postgres.db
	_testConnection = postgres.testConnection
}

export const db = _db
export const testConnection = _testConnection
