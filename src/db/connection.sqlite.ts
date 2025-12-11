import { Database } from 'bun:sqlite'

// In-memory SQLite database for testing
const sqlite = new Database(':memory:')

// Enable foreign keys
sqlite.run('PRAGMA foreign_keys = ON')

// Initialize test schema - simplified SQLite version of PostgreSQL migrations
function initializeSchema() {
	// Users table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			password_hash TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)

	// Teams table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS teams (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP
		)
	`)

	// Team members (team_role as TEXT instead of ENUM)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS team_members (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			role TEXT NOT NULL DEFAULT 'viewer',
			joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (team_id, user_id),
			FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id)`)

	// Playbooks table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS playbooks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id INTEGER,
			name TEXT NOT NULL,
			description TEXT,
			created_by INTEGER NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
			FOREIGN KEY (created_by) REFERENCES users(id)
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_playbooks_team ON playbooks(team_id)`)

	// Sections table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS sections (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			playbook_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			display_order INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_sections_playbook ON sections(playbook_id)`)

	// Plays table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS plays (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			playbook_id INTEGER NOT NULL,
			name TEXT,
			section_id INTEGER,
			play_type TEXT,
			formation_id INTEGER,
			personnel_id INTEGER,
			defensive_formation_id INTEGER,
			hash_position TEXT NOT NULL DEFAULT 'middle',
			notes TEXT,
			custom_players TEXT,
			custom_drawings TEXT,
			display_order INTEGER NOT NULL DEFAULT 0,
			created_by INTEGER NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
			FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
			FOREIGN KEY (created_by) REFERENCES users(id)
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_plays_playbook ON plays(playbook_id)`)

	// Sessions table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			token TEXT NOT NULL UNIQUE,
			expires_at TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`)
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`)

	// Schema migrations table (for compatibility)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at TEXT DEFAULT CURRENT_TIMESTAMP
		)
	`)

	// Concept tables (simplified for testing)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS formations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			description TEXT,
			created_by INTEGER NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
			FOREIGN KEY (created_by) REFERENCES users(id)
		)
	`)

	sqlite.run(`
		CREATE TABLE IF NOT EXISTS base_concepts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id INTEGER,
			playbook_id INTEGER,
			name TEXT NOT NULL,
			description TEXT,
			targeting_mode TEXT NOT NULL,
			ball_position TEXT NOT NULL DEFAULT 'center',
			play_direction TEXT NOT NULL DEFAULT 'na',
			created_by INTEGER NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			usage_count INTEGER NOT NULL DEFAULT 0,
			last_used_at TEXT,
			FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
			FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
			FOREIGN KEY (created_by) REFERENCES users(id)
		)
	`)

	sqlite.run(`
		CREATE TABLE IF NOT EXISTS concept_player_assignments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			concept_id INTEGER NOT NULL,
			role TEXT,
			selector_type TEXT,
			selector_params TEXT,
			drawing_data TEXT NOT NULL,
			order_index INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (concept_id) REFERENCES base_concepts(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`
		CREATE TABLE IF NOT EXISTS concept_groups (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id INTEGER NOT NULL,
			playbook_id INTEGER,
			name TEXT NOT NULL,
			description TEXT,
			formation_id INTEGER,
			created_by INTEGER NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			usage_count INTEGER NOT NULL DEFAULT 0,
			last_used_at TEXT,
			FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
			FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
			FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE SET NULL,
			FOREIGN KEY (created_by) REFERENCES users(id)
		)
	`)

	sqlite.run(`
		CREATE TABLE IF NOT EXISTS concept_applications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			play_id INTEGER NOT NULL,
			concept_id INTEGER,
			concept_group_id INTEGER,
			order_index INTEGER NOT NULL DEFAULT 0,
			applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
			FOREIGN KEY (concept_id) REFERENCES base_concepts(id) ON DELETE CASCADE,
			FOREIGN KEY (concept_group_id) REFERENCES concept_groups(id) ON DELETE CASCADE
		)
	`)
}

// Initialize schema on import
initializeSchema()

// Note: Bun's SQLite doesn't support custom aggregate functions yet
// As a workaround, queries using json_agg() will return the column as-is
// and the application layer will need to handle the aggregation
// For tests, we can work around this by modifying queries in the wrapper

// Postgres-compatible query interface
// The postgres library tagged template returns promises with array results
export const db = Object.assign(
	(strings: TemplateStringsArray, ...values: any[]) => {
		// Build query from template
		let query = strings[0]
		const params: any[] = []

		for (let i = 0; i < values.length; i++) {
			const value = values[i]

			// Handle arrays for ANY() operator
			if (Array.isArray(value)) {
				// Replace = ANY(?) with IN (?, ?, ...)
				const placeholders = value.map(() => '?').join(', ')
				query += placeholders + strings[i + 1]
				// Flatten array values into params
				for (const item of value) {
					if (item instanceof Date) {
						params.push(item.toISOString())
					} else {
						params.push(item)
					}
				}
			} else {
				query += '?' + strings[i + 1]
				// Convert Date objects to ISO strings for SQLite
				if (value instanceof Date) {
					params.push(value.toISOString())
				} else {
					params.push(value)
				}
			}
		}

		// Handle special PostgreSQL syntax that appears in tests
		query = query
			// Replace INTERVAL syntax with SQLite datetime
			.replace(/NOW\(\)\s*-\s*INTERVAL\s+'(\d+)\s+day'/gi, "datetime('now', '-$1 day')")
			.replace(/NOW\(\)/gi, "datetime('now')")
			.replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
			// Replace PostgreSQL json_agg with SQLite json_group_array
			.replace(/json_agg\(/gi, "json_group_array(")
			// Replace PostgreSQL type casting (::type) with SQLite CAST
			.replace(/\)::int\b/gi, ")") // COALESCE returns int already, no need to cast
			.replace(/\)::bigint\b/gi, ")")
			.replace(/\)::text\b/gi, ")")
			// Replace PostgreSQL ANY() with SQLite IN()
			.replace(/=\s*ANY\s*\(/gi, "IN (")

		// Execute query
		try {
			const isSelect = query.trim().toUpperCase().startsWith('SELECT')
			const isReturning = query.toUpperCase().includes('RETURNING')

			if (isSelect) {
				const stmt = sqlite.prepare(query)
				const results = stmt.all(...params)
				return Promise.resolve(results)
			} else if (isReturning) {
				// Handle INSERT/UPDATE/DELETE with RETURNING
				const stmt = sqlite.prepare(query)
				const result = stmt.all(...params)
				return Promise.resolve(result)
			} else {
				const stmt = sqlite.prepare(query)
				stmt.run(...params)
				return Promise.resolve([])
			}
		} catch (error) {
			console.error('SQLite query error:', error)
			console.error('Query:', query)
			console.error('Params:', params)
			return Promise.reject(error)
		}
	},
	{
		// Add unsafe method for compatibility with migrate.ts and dynamic queries
		unsafe: (query: string, params?: any[]) => {
			// Handle no parameters case (for migrations)
			if (!params || params.length === 0) {
				// For migrations, just execute raw SQL
				// Split on semicolons for multi-statement execution
				const statements = query.split(';').filter(s => s.trim())
				for (const stmt of statements) {
					if (stmt.trim()) {
						try {
							sqlite.exec(stmt)
						} catch (error) {
							// Ignore errors for PostgreSQL-specific syntax during migration
							// The schema is already initialized above
						}
					}
				}
				return Promise.resolve([])
			}

			// Handle parameterized queries
			// PostgreSQL uses $1, $2, etc. - convert to SQLite's ?
			let sqliteQuery = query.replace(/\$(\d+)/g, '?')

			// Convert Date objects to ISO strings
			const processedParams = params.map(p => p instanceof Date ? p.toISOString() : p)

			try {
				const isReturning = sqliteQuery.toUpperCase().includes('RETURNING')

				if (isReturning) {
					const stmt = sqlite.prepare(sqliteQuery)
					const result = stmt.all(...processedParams)
					return Promise.resolve(result)
				} else {
					const stmt = sqlite.prepare(sqliteQuery)
					stmt.run(...processedParams)
					return Promise.resolve([])
				}
			} catch (error) {
				console.error('SQLite unsafe query error:', error)
				console.error('Query:', sqliteQuery)
				console.error('Params:', processedParams)
				return Promise.reject(error)
			}
		}
	}
)

// Test connection function for compatibility
export async function testConnection(): Promise<boolean> {
	try {
		const stmt = sqlite.prepare('SELECT 1')
		stmt.all()
		return true
	} catch (error) {
		console.error('SQLite connection test failed:', error)
		return false
	}
}
