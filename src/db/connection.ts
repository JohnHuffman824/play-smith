import postgres from 'postgres'

const DATABASE_URL_REQUIRED = 'DATABASE_URL environment variable is required'
const CONNECTING_MESSAGE = '📊 Connecting to PostgreSQL database...'
const CONNECTION_SUCCESS_MESSAGE = '✅ Database connection successful'
const CONNECTION_FAILURE_MESSAGE = '❌ Database connection failed:'

if (!process.env.DATABASE_URL) {
	throw new Error(DATABASE_URL_REQUIRED)
}

console.log(CONNECTING_MESSAGE)

// Establishes a shared Postgres connection pool for app-wide reuse
export const db = postgres(process.env.DATABASE_URL, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
	transform: {
		undefined: null
	},
	types: {
		bigint: {
			to: 20,
			from: [20],
			parse: (value: string) => parseInt(value, 10),
			serialize: (value: number) => value.toString()
		}
	}
})

// Verifies database reachability during startup to fail fast
export async function testConnection(): Promise<boolean> {
	try {
		await db`SELECT 1`
		console.log(CONNECTION_SUCCESS_MESSAGE)
		return true
	} catch (error) {
		console.error(CONNECTION_FAILURE_MESSAGE, error)
		return false
	}
}
