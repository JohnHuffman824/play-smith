import { db } from './src/db/connection'

try {
	const result = await db`SELECT version()`
	console.log('✅ Connected to Railway!')
	console.log('PostgreSQL version:', result[0].version.split('\n')[0])
	process.exit(0)
} catch (e: any) {
	console.error('❌ Connection failed:', e.message)
	process.exit(1)
}
