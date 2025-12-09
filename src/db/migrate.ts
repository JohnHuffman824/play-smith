import { db } from './connection';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface Migration {
	id: number;
	name: string;
	applied_at: Date;
}

async function createMigrationsTable(): Promise<void> {
	await db`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id INT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`;
}

async function getAppliedMigrations(): Promise<Set<number>> {
	const rows = await db<Migration[]>`
		SELECT id FROM schema_migrations ORDER BY id
	`;
	return new Set(rows.map(r => r.id));
}

async function getMigrationFiles(): Promise<Array<{ id: number; name: string; path: string }>> {
	const migrationsDir = join(import.meta.dir, 'migrations');
	const files = await readdir(migrationsDir);

	return files
		.filter(f => f.endsWith('.sql'))
		.map(f => {
			const match = f.match(/^(\d+)_(.+)\.sql$/);
			if (!match) throw new Error(`Invalid migration filename: ${f}`);
			return {
				id: parseInt(match[1], 10),
				name: match[2],
				path: join(migrationsDir, f),
			};
		})
		.sort((a, b) => a.id - b.id);
}

export async function migrate(): Promise<void> {
	await createMigrationsTable();

	const applied = await getAppliedMigrations();
	const migrations = await getMigrationFiles();

	for (const migration of migrations) {
		if (applied.has(migration.id)) {
			console.log(`✓ Migration ${migration.id}_${migration.name} already applied`);
			continue;
		}

		console.log(`→ Applying migration ${migration.id}_${migration.name}...`);
		const sql = await readFile(migration.path, 'utf-8');

		try {
			// Execute migration
			await db.unsafe(sql);

			// Record migration
			await db`
				INSERT INTO schema_migrations (id, name)
				VALUES (${migration.id}, ${migration.name})
			`;

			console.log(`✓ Applied migration ${migration.id}_${migration.name}`);
		} catch (error) {
			console.error(`✗ Failed to apply migration ${migration.id}_${migration.name}:`, error);
			throw error;
		}
	}

	console.log('✓ All migrations applied successfully');
}

// Run migrations if called directly
if (import.meta.main) {
	migrate()
		.then(() => process.exit(0))
		.catch(err => {
			console.error(err);
			process.exit(1);
		});
}
