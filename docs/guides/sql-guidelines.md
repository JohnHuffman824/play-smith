# PostgreSQL Guidelines

Actionable checklist for writing production-quality PostgreSQL code.

---

## Security (CHECK FIRST)

- **Always use parameterized queries** - never concatenate user input into SQL
- Validate and sanitize all inputs at application boundary
- Use least-privilege database roles - grant only necessary permissions
- Never log or expose sensitive data in queries
- Set statement timeouts to prevent resource exhaustion
- Escape identifiers if dynamic (use quote_ident/quote_literal)

---

## Schema Design

### Tables & Columns
- Every table needs a primary key (prefer `BIGINT` for `id`)
- Use `NOT NULL` by default; only allow NULL when explicitly needed
- Define `DEFAULT` values explicitly
- Name columns descriptively:
  - Primary key: `id`
  - Timestamps: `created_at`, `updated_at` (use `TIMESTAMPTZ`)
  - Booleans: `is_active`, `has_permission`
- Keep tables narrow (<15 columns); split wide tables vertically
- Use appropriate types:
  - `TEXT/VARCHAR` not `CHAR(n)`
  - `INTEGER` for counts, `BIGINT` for IDs
  - `NUMERIC` for precision (money, measurements)
  - `TIMESTAMPTZ` for timestamps (store UTC)
  - `JSONB` for flexible non-key data
  - Enums for small fixed sets

### Constraints & Relationships
- Enforce data integrity with constraints (`UNIQUE`, `CHECK`, `EXCLUDE`)
- Prefer application-level foreign keys for flexibility
- If using FK constraints, specify actions (`ON DELETE CASCADE/SET NULL`)
- Add indexes for all foreign key columns
- Watch for cascade delete chains - review carefully

### Naming Conventions
- Use `lowercase_snake_case` everywhere
- Tables: plural nouns (`users`, `order_items`)
- Views: prefix with `v_` (`v_active_users`)
- Materialized views: prefix with `mv_`
- Indexes: descriptive suffixes
  - `_pkey` for primary key
  - `_idx` for regular indexes
  - `_key` for unique indexes
- Functions: verb-first (`select_users_by_team`, `insert_order`)
- Avoid reserved words, `pg_*` prefix, non-ASCII characters

---

## Writing Queries

### Every Query Must
- ✅ Use parameterized queries/prepared statements
- ✅ List columns explicitly - never `SELECT *`
- ✅ Include `WHERE` clause with indexed columns
- ✅ Have appropriate timeout configured
- ✅ Use connection pooling

### Query Patterns
**Existence checks:**
```sql
SELECT 1 FROM users WHERE email = $1 LIMIT 1
-- or
SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)
```

**Insert/Update patterns:**
```sql
-- Use RETURNING to get created data
INSERT INTO users (name, email)
VALUES ($1, $2)
RETURNING id, created_at;

-- Use UPSERT for idempotency
INSERT INTO settings (user_id, key, value)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value;
```

**Safe counting:**
```sql
-- All rows including NULL
SELECT COUNT(*) FROM users;

-- Only non-null values
SELECT COUNT(email) FROM users;

-- Avoid null in aggregates
SELECT COALESCE(SUM(amount), 0) FROM orders;
```

**NULL handling:**
```sql
-- NULL-safe comparison
WHERE status IS DISTINCT FROM 'cancelled'

-- Explicit NULL sorting
ORDER BY created_at DESC NULLS LAST
```

### Performance Rules
1. **Filter early** - WHERE clauses on indexed columns first
2. **Select only needed columns** - no `SELECT *`
3. **Avoid full table scans** - check EXPLAIN plan
4. **Order matters**: `filter → join → aggregate`
5. **Prefer indexed lookups**:
   - `= ANY(ARRAY[$1, $2])` over `IN ($1, $2)` for large lists
   - Avoid `LIKE '%term'` (left-anchored wildcards)
   - Avoid `NOT`/`!=` as leading filters
6. **Pre-filter before joins** - reduce rows before expensive operations

### Transactions
- Keep transactions short - acquire locks late, release early
- Prefer autocommit for single statements
- Use appropriate isolation level:
  - `READ COMMITTED` (default) for most cases
  - `REPEATABLE READ` only when needed (handle retry logic)
- Close cursors promptly
- Never run DDL in transactions that modify data

---

## Indexes

### When to Index
- All primary keys (automatic)
- All foreign key columns
- Columns in WHERE clauses
- Columns in ORDER BY (especially with pagination)
- Columns in JOIN conditions

### Index Types
- **B-tree** (default): equality, range queries, sorting
- **GIN**: full-text search, JSONB, arrays
- **GiST**: geometric data, nearest-neighbor searches
- **Hash**: equality only (rarely needed)
- **BRIN**: append-only data (timestamps, IDs)
- **Partial**: `CREATE INDEX ON orders (user_id) WHERE status = 'pending'`
- **Functional**: `CREATE INDEX ON users (LOWER(email))`

### Index Best Practices
- Don't index small tables (<1000 rows)
- Don't index columns with low cardinality (few distinct values)
- Don't index large text fields directly (use GIN for search)
- Order composite indexes by cardinality: high → low
- Create/drop indexes with `CONCURRENTLY` in production
- Remove unused indexes - they slow down writes

---

## Common Anti-Patterns to Avoid

❌ **SQL Injection:**
```sql
-- NEVER DO THIS
query = f"SELECT * FROM users WHERE email = '{user_input}'"
```

❌ **SELECT * in application code**
```sql
-- Don't: wasteful, breaks on schema changes
SELECT * FROM users WHERE id = $1
-- Do: explicit columns
SELECT id, name, email FROM users WHERE id = $1
```

❌ **N+1 Queries**
```sql
-- Don't: query in loop
for user in users:
    orders = db.query("SELECT * FROM orders WHERE user_id = ?", user.id)
-- Do: join or IN clause
SELECT * FROM orders WHERE user_id = ANY($1)
```

❌ **Large IN clauses**
```sql
-- Don't: IN with >1000 items
SELECT * FROM users WHERE id IN (1,2,3,...,10000)
-- Do: temp table or array
SELECT * FROM users WHERE id = ANY($1::bigint[])
```

❌ **Implicit transactions**
```sql
-- Don't: leave transaction open
BEGIN; SELECT ...; -- forgot COMMIT
```

❌ **Missing indexes on foreign keys**
```sql
-- Always index FK columns
CREATE INDEX orders_user_id_idx ON orders(user_id);
```

---

## Monitoring & Maintenance

- Log slow queries (>100ms)
- Monitor connection pool utilization
- Watch for lock contention
- Check for bloat in tables/indexes
- Verify backup success and recovery time
- Run `ANALYZE` after bulk operations
- Use `EXPLAIN ANALYZE` to verify query plans

---

## Quick Reference

**Type Selection:**
- IDs → `BIGINT`
- Small integers → `INTEGER`
- Money → `NUMERIC(10,2)`
- Text → `TEXT` or `VARCHAR(n)` with limit
- Timestamps → `TIMESTAMPTZ`
- Booleans → `BOOLEAN`
- JSON → `JSONB` (not JSON)

**Connection Pool Settings:**
- Min connections: 10
- Max connections: 100 (tune based on load)
- Idle timeout: 30s
- Max lifetime: 30min

**Performance Targets:**
- Simple queries: <10ms
- Complex queries: <100ms
- Slow query threshold: >1s → investigate
