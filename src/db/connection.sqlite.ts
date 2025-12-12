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

	// Folders table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS folders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id)`)

	// Playbooks table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS playbooks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id INTEGER,
			name TEXT NOT NULL,
			description TEXT,
			created_by INTEGER NOT NULL,
			folder_id INTEGER,
			is_starred INTEGER DEFAULT 0,
			deleted_at TEXT,
			last_accessed_at TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
			FOREIGN KEY (created_by) REFERENCES users(id),
			FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_playbooks_team ON playbooks(team_id)`)
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_playbooks_folder ON playbooks(folder_id)`)
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_playbooks_starred ON playbooks(is_starred) WHERE is_starred = 1`)
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_playbooks_deleted ON playbooks(deleted_at) WHERE deleted_at IS NOT NULL`)

	// Playbook shares table
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS playbook_shares (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			playbook_id INTEGER NOT NULL,
			shared_with_team_id INTEGER NOT NULL,
			permission TEXT NOT NULL DEFAULT 'view',
			shared_by INTEGER NOT NULL,
			shared_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (playbook_id, shared_with_team_id),
			FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
			FOREIGN KEY (shared_with_team_id) REFERENCES teams(id) ON DELETE CASCADE,
			FOREIGN KEY (shared_by) REFERENCES users(id)
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_playbook_shares_shared_team ON playbook_shares(shared_with_team_id)`)

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
		CREATE TABLE IF NOT EXISTS formation_player_positions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			formation_id INTEGER NOT NULL,
			role TEXT NOT NULL,
			position_x REAL NOT NULL,
			position_y REAL NOT NULL,
			hash_relative INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (formation_id, role),
			FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_formation_positions_formation ON formation_player_positions(formation_id)`)

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
		CREATE TABLE IF NOT EXISTS concept_group_concepts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			concept_group_id INTEGER NOT NULL,
			concept_id INTEGER NOT NULL,
			order_index INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (concept_group_id, concept_id),
			FOREIGN KEY (concept_group_id) REFERENCES concept_groups(id) ON DELETE CASCADE,
			FOREIGN KEY (concept_id) REFERENCES base_concepts(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_group_concepts_group ON concept_group_concepts(concept_group_id)`)
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_group_concepts_order ON concept_group_concepts(concept_group_id, order_index)`)

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

	// Tags tables
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id INTEGER,
			name TEXT NOT NULL,
			color TEXT NOT NULL,
			is_preset INTEGER NOT NULL DEFAULT 0,
			created_by INTEGER,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
			FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
			UNIQUE (team_id, name)
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_tags_team ON tags(team_id)`)
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_tags_preset ON tags(is_preset)`)

	// Seed preset tags for SQLite tests
	sqlite.run(`
		INSERT OR IGNORE INTO tags (name, color, is_preset, team_id, created_by) VALUES
			('Short Yardage', '#10B981', 1, NULL, NULL),
			('Mid Yardage', '#FBBF24', 1, NULL, NULL),
			('Long Yardage', '#F97316', 1, NULL, NULL),
			('Redzone', '#EF4444', 1, NULL, NULL),
			('Goal Line', '#F43F5E', 1, NULL, NULL),
			('3rd Down', '#3B82F6', 1, NULL, NULL),
			('Quick Game', '#8B5CF6', 1, NULL, NULL),
			('Play Action', '#6366F1', 1, NULL, NULL),
			('RPO', '#14B8A6', 1, NULL, NULL),
			('Option', '#06B6D4', 1, NULL, NULL)
	`)

	sqlite.run(`
		CREATE TABLE IF NOT EXISTS play_tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			play_id INTEGER NOT NULL,
			tag_id INTEGER NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (play_id, tag_id),
			FOREIGN KEY (play_id) REFERENCES plays(id) ON DELETE CASCADE,
			FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_play_tags_play ON play_tags(play_id)`)
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_play_tags_tag ON play_tags(tag_id)`)

	sqlite.run(`
		CREATE TABLE IF NOT EXISTS playbook_tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			playbook_id INTEGER NOT NULL,
			tag_id INTEGER NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (playbook_id, tag_id),
			FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE,
			FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
		)
	`)

	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_playbook_tags_playbook ON playbook_tags(playbook_id)`)
	sqlite.run(`CREATE INDEX IF NOT EXISTS idx_playbook_tags_tag ON playbook_tags(tag_id)`)
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
			// Replace PostgreSQL json_build_object with SQLite json_object
			.replace(/json_build_object\(/gi, "json_object(")
			// Remove PostgreSQL ::json type casting
			.replace(/'(\[\])'::json/gi, "'$1'")
			// Replace PostgreSQL type casting (::type) with SQLite CAST
		.replace(/::float\b/gi, " * 1.0") // Convert to float by multiplying by 1.0
			.replace(/\)::int\b/gi, ")") // COALESCE returns int already, no need to cast
			.replace(/\)::bigint\b/gi, ")")
			.replace(/\)::text\b/gi, ")")
		// Replace PostgreSQL EXTRACT(EPOCH FROM ...) with SQLite equivalent
		.replace(/EXTRACT\s*\(\s*EPOCH\s+FROM\s+\(\s*datetime\('now'\)\s*-\s*COALESCE\(([^)]+)\)\s*\)\s*\)/gi, "(julianday(datetime('now')) - julianday(COALESCE($1))) * 86400")
		// Replace PostgreSQL ILIKE with SQLite LIKE
		.replace(/\bILIKE\b/gi, "LIKE")
			// Replace PostgreSQL ANY() with SQLite IN()
			.replace(/=\s*ANY\s*\(/gi, "IN (")

		// Helper function to parse date and boolean fields in results
		const parseDateFields = (obj: any): any => {
			if (!obj || typeof obj !== 'object') return obj

			const dateFields = ['created_at', 'updated_at', 'expires_at', 'joined_at', 'applied_at', 'last_used_at']
			const booleanFields = ['hash_relative']
			const result = { ...obj }

			// Parse date fields
			for (const field of dateFields) {
				if (field in result && typeof result[field] === 'string') {
					// Try to parse as Date
					const date = new Date(result[field])
					if (!isNaN(date.getTime())) {
						result[field] = date
					}
				}
			}

			// Parse boolean fields (SQLite INTEGER 0/1 to JavaScript boolean)
			for (const field of booleanFields) {
				if (field in result && typeof result[field] === 'number') {
					result[field] = result[field] === 1
				}
			}

			return result
		}

		// Execute query
		try {
			const isSelect = query.trim().toUpperCase().startsWith('SELECT')
			const isReturning = query.toUpperCase().includes('RETURNING')

			if (isSelect) {
				const stmt = sqlite.prepare(query)
				const results = stmt.all(...params)
				// Parse date fields in all result rows
				const parsedResults = results.map(parseDateFields)
				return Promise.resolve(parsedResults)
			} else if (isReturning) {
				// Handle INSERT/UPDATE/DELETE with RETURNING
				const stmt = sqlite.prepare(query)
				const result = stmt.all(...params)
				// Parse date fields in all result rows
				const parsedResult = result.map(parseDateFields)
				return Promise.resolve(parsedResult)
			} else {
				const stmt = sqlite.prepare(query)
				const info = stmt.run(...params)
				// Return count of affected rows for compatibility with PostgreSQL
				return Promise.resolve({ count: info.changes } as any)
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

			// Remove PostgreSQL type casts before processing arrays
			sqliteQuery = sqliteQuery.replace(/::bigint\[\]/gi, '')
			sqliteQuery = sqliteQuery.replace(/= ANY\(/gi, 'IN (')

			// Convert Date objects to ISO strings
			// Handle arrays for ANY() operator by flattening them
			const processedParams: any[] = []
			for (const p of params) {
				if (p instanceof Date) {
					processedParams.push(p.toISOString())
				} else if (Array.isArray(p)) {
					// Flatten array for IN (...) clause
					for (const item of p) {
						processedParams.push(item)
					}
				} else {
					processedParams.push(p)
				}
			}

			// Now replace placeholders with correct number for flattened arrays
			// Count how many placeholders we need
			let placeholderIndex = 0
			sqliteQuery = sqliteQuery.replace(/\?/g, () => {
				placeholderIndex++
				return '?'
			})

			// Handle IN clause with array expansion
			// Find "IN (?)" patterns and expand based on array length
			const finalParams: any[] = []
			let paramIndex = 0
			sqliteQuery = sqliteQuery.replace(/\?/g, () => {
				if (paramIndex < params.length) {
					const param = params[paramIndex]
					if (Array.isArray(param)) {
						// Replace single ? with ?, ?, ? for array length
						const placeholders = param.map(() => '?').join(', ')
						param.forEach(item => finalParams.push(item))
						paramIndex++
						return placeholders
					} else {
						finalParams.push(param instanceof Date ? param.toISOString() : param)
						paramIndex++
						return '?'
					}
				}
				return '?'
			})

			// Helper function to parse date and boolean fields in results
			const parseDateFields = (obj: any): any => {
				if (!obj || typeof obj !== 'object') return obj

				const dateFields = ['created_at', 'updated_at', 'expires_at', 'joined_at', 'applied_at', 'last_used_at']
				const booleanFields = ['hash_relative']
				const result = { ...obj }

				// Parse date fields
				for (const field of dateFields) {
					if (field in result && typeof result[field] === 'string') {
						// Try to parse as Date
						const date = new Date(result[field])
						if (!isNaN(date.getTime())) {
							result[field] = date
						}
					}
				}

				// Parse boolean fields (SQLite INTEGER 0/1 to JavaScript boolean)
				for (const field of booleanFields) {
					if (field in result && typeof result[field] === 'number') {
						result[field] = result[field] === 1
					}
				}

				return result
			}

			try {
				const isReturning = sqliteQuery.toUpperCase().includes('RETURNING')

				if (isReturning) {
					const stmt = sqlite.prepare(sqliteQuery)
					const result = stmt.all(...finalParams)
					// Parse date fields in all result rows
					const parsedResult = result.map(parseDateFields)
					return Promise.resolve(parsedResult)
				} else {
					const stmt = sqlite.prepare(sqliteQuery)
					const info = stmt.run(...finalParams)
					// Return count of affected rows for compatibility with PostgreSQL
					return Promise.resolve({ count: info.changes } as any)
				}
			} catch (error) {
				console.error('SQLite unsafe query error:', error)
				console.error('Query:', sqliteQuery)
				console.error('Params:', finalParams)
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
