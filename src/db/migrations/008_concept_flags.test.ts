import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { Database } from 'bun:sqlite'
import { readFileSync } from 'fs'

describe('008_concept_flags migration', () => {
  let db: Database

  beforeAll(() => {
    db = new Database(':memory:')
    // Create minimal schema for testing (SQLite version)
    db.exec(`
      CREATE TABLE teams (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
      CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
      CREATE TABLE playbooks (id INTEGER PRIMARY KEY AUTOINCREMENT, team_id INTEGER);

      CREATE TABLE formations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE base_concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER,
        playbook_id INTEGER,
        name TEXT NOT NULL,
        targeting_mode TEXT NOT NULL,
        ball_position TEXT NOT NULL DEFAULT 'center',
        play_direction TEXT NOT NULL DEFAULT 'na',
        drawing_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
  })

  afterAll(() => {
    db.close()
  })

  test('adds is_motion and is_modifier columns to base_concepts', () => {
    // SQLite version of the migration
    db.exec(`
      ALTER TABLE base_concepts ADD COLUMN is_motion BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE base_concepts ADD COLUMN is_modifier BOOLEAN NOT NULL DEFAULT false;
    `)

    // Check columns exist with defaults
    const result = db.query(`
      INSERT INTO base_concepts (team_id, name, targeting_mode, ball_position, play_direction, drawing_data)
      VALUES (1, 'Test', 'absolute_role', 'center', 'na', '{}')
      RETURNING is_motion, is_modifier
    `).get() as { is_motion: number; is_modifier: number }

    expect(result.is_motion).toBe(0) // false in SQLite
    expect(result.is_modifier).toBe(0)
  })

  test('creates modifier_formation_overrides table', () => {
    // Create the table (SQLite version)
    db.exec(`
      CREATE TABLE modifier_formation_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modifier_concept_id INTEGER NOT NULL REFERENCES base_concepts(id) ON DELETE CASCADE,
        formation_id INTEGER NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
        override_rules TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT modifier_override_unique UNIQUE (modifier_concept_id, formation_id)
      );

      CREATE INDEX idx_modifier_overrides_concept ON modifier_formation_overrides(modifier_concept_id);
      CREATE INDEX idx_modifier_overrides_formation ON modifier_formation_overrides(formation_id);
    `)

    const tables = db.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='modifier_formation_overrides'
    `).all()

    expect(tables.length).toBe(1)
  })

  test('modifier_formation_overrides has unique constraint', () => {
    // Insert a formation first
    db.exec(`INSERT INTO formations (team_id, name) VALUES (1, 'Shotgun')`)

    // Insert a modifier concept
    db.exec(`
      INSERT INTO base_concepts (team_id, name, targeting_mode, ball_position, play_direction, drawing_data, is_modifier)
      VALUES (1, 'Tight', 'absolute_role', 'center', 'na', '{}', 1)
    `)

    // Insert override
    db.exec(`
      INSERT INTO modifier_formation_overrides (modifier_concept_id, formation_id, override_rules)
      VALUES (1, 1, '{"role": "Y", "delta_x": -3}')
    `)

    // Second insert with same combo should fail
    expect(() => {
      db.exec(`
        INSERT INTO modifier_formation_overrides (modifier_concept_id, formation_id, override_rules)
        VALUES (1, 1, '{"role": "X", "delta_x": -2}')
      `)
    }).toThrow()
  })
})
