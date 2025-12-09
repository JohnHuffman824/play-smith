import { db } from './connection'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const MIGRATIONS_DIR = join(import.meta.dir, 'migrations')
const MIGRATION_FILE_PATTERN = /^(\d+)_(.+)\.sql$/
const MIGRATION_READ_ERROR = 'Invalid migration filename: '

interface Migration {
	id: number
	name: string
	applied_at: Date
}

// Ensures schema tracking table exists before any migrations run
async function createMigrationsTable(): Promise<void> {
	await db`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id INTEGER PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`
}

// Reads applied migration ids to prevent duplicate execution
async function getAppliedMigrations(): Promise<Set<number>> {
	const rows = await db<Migration[]>`
		SELECT id FROM schema_migrations ORDER BY id
	`
	return new Set(rows.map(row => row.id))
}

// Collects migration files, ensuring valid names and ordered execution
async function getMigrationFiles(): Promise<
	Array<{ id: number; name: string; path: string }>
> {
	const files = await readdir(MIGRATIONS_DIR)

	return files
		.filter(file => file.endsWith('.sql'))
		.map(file => {
			const match = file.match(MIGRATION_FILE_PATTERN)
			if (!match) throw new Error(`${MIGRATION_READ_ERROR}${file}`)
			return {
				id: parseInt(match[1], 10),
				name: match[2],
				path: join(MIGRATIONS_DIR, file)
			}
		})
		.sort((first, second) => first.id - second.id)
}

// Applies any pending migrations in order and records completion
export async function migrate(): Promise<void> {
	await createMigrationsTable()

	const applied = await getAppliedMigrations()
	const migrations = await getMigrationFiles()

	for (const migration of migrations) {
		const migrationLabel = `${migration.id}_${migration.name}`

		if (applied.has(migration.id)) {
			console.log(`✓ Migration ${migrationLabel} already applied`)
			continue
		}

		console.log(`→ Applying migration ${migrationLabel}...`)
		const sql = await readFile(migration.path, 'utf-8')

		try {
			await db.unsafe(sql)
			await db`
				INSERT INTO schema_migrations (id, name)
				VALUES (${migration.id}, ${migration.name})
			`

			console.log(`✓ Applied migration ${migrationLabel}`)
		} catch (error) {
			console.error(`✗ Failed to apply migration ${migrationLabel}:`, error)
			throw error
		}
	}

	console.log('✓ All migrations applied successfully')
}

if (import.meta.main) {
	migrate()
		.then(() => process.exit(0))
		.catch(error => {
			console.error(error)
			process.exit(1)
		})
}
