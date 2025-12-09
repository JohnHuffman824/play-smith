# PostgreSQL Migration Decision

**Date:** 2024-12-09
**Decision:** Migrate from MySQL to PostgreSQL for PlaySmith database

## Context

PlaySmith is an American football play and playbook creator with sophisticated requirements:
- Geometric/spatial data (drawing control points with x,y coordinates)
- Complex JSON operations (audit log changes tracking)
- Team-based collaborative editing
- Normalized drawing geometry (segments, control points, bezier curves)
- Advanced query patterns (spatial queries, JSON queries, complex joins)

Initial architecture planning targeted MySQL, but after evaluation PostgreSQL emerged as the superior choice.

## Decision Drivers

### 1. Advanced Features & Data Integrity (Primary)
**Winner: PostgreSQL**

- **Geometric Types**: PostgreSQL + PostGIS provides native `POINT`, `GEOMETRY` types
  - Control points `(x, y)` can use proper geometric types
  - Built-in spatial indexing (GiST, SP-GiST)
  - Distance calculations, bounding boxes, intersection detection - all built-in
  - vs MySQL: Basic spatial support, but PostgreSQL + PostGIS is industry-standard

- **JSON Operations**: PostgreSQL's JSONB is superior
  - Rich query operators for audit log `changes` JSON column
  - Can efficiently query: "show all changes to formation_id field"
  - GIN indexing for fast JSON key/value lookups
  - vs MySQL: Has JSON support but more limited query capabilities

- **Constraints & Integrity**: PostgreSQL excels
  - Check constraints, exclusion constraints
  - Partial indexes: "index only unlinked players"
  - Better transaction isolation (MVCC)
  - Critical for collaborative editing scenarios

### 2. Elite Performance (Primary)
**Winner: Context-dependent, PostgreSQL has advantages for PlaySmith**

- **Spatial Queries**: PostgreSQL + PostGIS optimized for geometric operations
  - "Find control points within 5 feet for merge detection"
  - Bounding box queries during drawing operations
  - vs MySQL: Can do basic spatial queries but not optimized like PostGIS

- **JSON Queries**: JSONB indexing enables fast audit log queries
  - Filter by specific field changes efficiently
  - vs MySQL: JSON querying slower without same indexing options

- **Complex Joins**: PostgreSQL query planner handles complex joins better
  - Loading plays with segments, control points, player links
  - Permission checks (team members + playbook shares)

- **Write Performance**:
  - MySQL traditionally faster for simple inserts
  - PostgreSQL competitive and MVCC better for concurrent edits
  - For collaborative editing (multiple users, same playbook), PostgreSQL MVCC wins

### 3. Deployment Flexibility (Secondary)
**Neutral - Both well-supported**

- **AWS RDS**: Supports both MySQL and PostgreSQL equally
  - **Decision: Using AWS RDS for managed PostgreSQL hosting**
  - Benefits: Automated backups, monitoring, scaling, high availability
  - See: `docs/AWS-RDS-Setup.md` for complete setup guide
- Self-hosted: Both manageable (not chosen for production)
- Cost: Similar for both databases on RDS
- Community: Both strong, PostgreSQL community known for advanced features

## PostgreSQL Advantages for PlaySmith

1. **PostGIS for spatial queries** - Purpose-built for geometric data
2. **JSONB for audit logging** - Rich queries on change history
3. **Better constraints** - Partial indexes, exclusion constraints
4. **MVCC for collaboration** - Multiple users editing simultaneously
5. **Future-proof** - Advanced features available as needs grow

## MySQL Advantages (Not chosen)

1. Simpler for basic CRUD operations
2. Slightly faster simple inserts (not critical for PlaySmith)
3. More familiar to some developers

## Trade-offs Accepted

- **Learning curve**: PostgreSQL syntax slightly different (SERIAL vs AUTO_INCREMENT)
- **Migration complexity**: Need to convert existing MySQL work (3 migrations, connection code)
- **Setup**: Requires PostgreSQL installation vs MySQL

## Outcome

**Decision: Migrate to PostgreSQL on AWS RDS**

The combination of:
- PostGIS spatial capabilities
- Superior JSONB support
- Better concurrency control (MVCC)
- AWS RDS managed hosting (automated backups, monitoring, scaling)

...aligns perfectly with PlaySmith's requirements for geometric data, audit logging, collaborative editing, and production reliability.

## Implementation Plans

1. **AWS RDS Setup**: `docs/AWS-RDS-Setup.md`
2. **PostgreSQL Migration**: `docs/plans/2024-12-09-postgresql-migration-plan.md`

## References

- PlaySmith Design Document: `docs/PlaySmithDesignDocument.md`
- Database Architecture: `docs/DatabaseArchitecture.md`
- Phase 1 Implementation (MySQL): `docs/plans/2024-12-09-database-architecture-phase1.md`
