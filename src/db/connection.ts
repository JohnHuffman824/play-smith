import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

console.log('📊 Connecting to PostgreSQL database...');

// Create PostgreSQL connection using postgres library
export const db = postgres(process.env.DATABASE_URL, {
	// Connection options
	max: 10, // Maximum number of connections in pool
	idle_timeout: 20, // Close idle connections after 20 seconds
	connect_timeout: 10, // Timeout for new connections
	// Transform bigint to number for JavaScript compatibility
	transform: {
		undefined: null, // Convert undefined to null
	},
	types: {
		bigint: {
			to: 20,
			from: [20],
			parse: (x: string) => parseInt(x, 10),
			serialize: (x: number) => x.toString(),
		},
	},
});

export async function testConnection(): Promise<boolean> {
	try {
		await db`SELECT 1`;
		console.log('✅ Database connection successful');
		return true;
	} catch (error) {
		console.error('❌ Database connection failed:', error);
		return false;
	}
}
