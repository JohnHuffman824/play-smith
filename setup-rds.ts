import postgres from 'postgres'

// Pre-configured RDS settings
const host =
	'playsmith-dev.c940uiy0ypml.us-east-2.rds.amazonaws.com'
const username = 'playsmith_admin'
const database = 'playsmith_dev'
const VERSION_MISSING_ERROR = 'PostgreSQL version not returned'
const POSTGIS_VERSION_MISSING_ERROR = 'PostGIS version not returned'

console.log('🔧 PlaySmith RDS Setup\n')
console.log(`Host: ${host}`)
console.log(`Username: ${username}`)
console.log(`Database: ${database}\n`)

// Waits for a single stdin response to avoid persisting prompts
function prompt(question: string): Promise<string> {
	return new Promise(resolve => {
		process.stdout.write(question)
		process.stdin.once('data', data => {
			resolve(data.toString().trim())
		})
	})
}

// Only prompt for password
const password = await prompt('Master password: ')

console.log('\n🔌 Connecting to RDS...\n')

try {
	const sql = postgres({
		host,
		port: 5432,
		username,
		password,
		database,
		ssl: 'require'
	})

	// Test connection
	const [versionRow] = await sql<{ version: string }[]>`
		SELECT version()
	`
	if (!versionRow?.version) {
		throw new Error(VERSION_MISSING_ERROR)
	}
	console.log('✅ Connected successfully!')
	console.log('PostgreSQL version:', versionRow.version.split('\n')[0])

	// Enable PostGIS
	console.log('\n📍 Enabling PostGIS extension...')
	await sql`CREATE EXTENSION IF NOT EXISTS postgis`
	console.log('✓ PostGIS extension enabled')

	// Enable PostGIS Topology
	console.log('\n📐 Enabling PostGIS Topology extension...')
	await sql`CREATE EXTENSION IF NOT EXISTS postgis_topology`
	console.log('✓ PostGIS Topology extension enabled')

	// Verify PostGIS installation
	console.log('\n🔍 Verifying PostGIS installation...')
	const [postgisVersion] = await sql<{ postgis_version: string }[]>`
		SELECT PostGIS_Version()
	`
	if (!postgisVersion?.postgis_version) {
		throw new Error(POSTGIS_VERSION_MISSING_ERROR)
	}
	console.log('✓ PostGIS version:', postgisVersion.postgis_version)

	// List all enabled extensions
	console.log('\n📦 Enabled extensions:')
	const extensions = await sql`
		SELECT extname, extversion
		FROM pg_extension
		WHERE extname IN ('postgis', 'postgis_topology')
		ORDER BY extname
	`
	extensions.forEach(ext => {
		console.log(`  - ${ext.extname} v${ext.extversion}`)
	})

	console.log('\n✅ Database setup complete!')
	console.log('\n📝 Connection string for .env:')
	const encodedPassword = encodeURIComponent(password)
	const connectionString =
		'DATABASE_URL=postgres://' +
		`${username}:${encodedPassword}@${host}:5432/` +
		`${database}?sslmode=require`
	console.log(connectionString)

	await sql.end()
	process.exit(0)
} catch (error: any) {
	console.error('❌ Connection failed!\n')
	console.error('Error:', error.message)

	if (error.message.includes('password authentication failed')) {
		console.error('\n🔍 Password authentication failed. Please verify:')
		console.error(
			'  1. Check the master password in AWS Console → ' +
				'RDS → Databases → playsmith-dev'
		)
		console.error(
			'  2. If you lost the password, you can modify it:'
		)
		console.error('     - Select playsmith-dev → Modify → New master password')
		console.error(
			'  3. Make sure you\'re using the MASTER password, not any other ' +
				'password'
		)
	} else if (
		error.message.includes('database') &&
		error.message.includes('does not exist')
	) {
		console.error(
			'\n🔍 Database does not exist. Check Configuration tab in RDS Console.'
		)
	} else if (
		error.message.includes('timeout') ||
		error.message.includes('ECONNREFUSED')
	) {
		console.error('\n🔍 Cannot reach RDS instance. Check:')
		console.error('  1. Security group allows your IP on port 5432')
		console.error('  2. RDS instance has "Publicly accessible" = Yes')
		console.error('  3. Instance status is "Available"')
	}

	process.exit(1)
}
