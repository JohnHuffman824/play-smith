# Environments

## Overview

PlaySmith has three environments: local development, staging (integration testing), and production (live).

---

## Environment Comparison

| Environment | Branch | URL | Auto-Deploy | Database | Purpose |
|------------|--------|-----|-------------|----------|---------|
| Local | `main` | http://localhost:3000 | N/A | Railway staging or local | Development |
| Staging | `staging` | https://stag.play-smith.com | ✅ Yes | Railway staging DB | Testing |
| Production | `release-1.0` | https://www.play-smith.com | ❌ No (manual) | Railway production DB | Live |

---

## Local Development

### Initial Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/JohnHuffman824/play-smith.git
   cd play-smith
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   ```

4. **Run migrations:**
   ```bash
   bun run migrate
   ```

5. **Seed development data:**
   ```bash
   bun run seed:dev
   # Creates admin user: admin / ALtt98xzH!
   ```

6. **Start development server:**
   ```bash
   bun run dev
   # Runs on http://localhost:3000 with hot reload
   ```

### Local Environment Variables

**Required in `.env`:**
```bash
DATABASE_URL=postgresql://user:password@host:port/database
BUN_ENV=development
```

**Optional:**
```bash
PORT=3000
SESSION_SECRET=your-secret-key
```

### Database Options for Local Development

**Option 1: Use Railway Staging Database (Recommended)**
- Copy `DATABASE_URL` from Railway staging environment
- Paste into local `.env` file
- Shares data with staging environment

**Option 2: Local PostgreSQL**
- Install PostgreSQL 17+ locally
- Create database: `createdb playsmith_dev`
- Set `DATABASE_URL=postgresql://localhost/playsmith_dev`
- Run migrations to set up schema

---

## Staging Environment

### Purpose

- Integration testing of features before production
- Verify database migrations in production-like environment
- Test cross-feature interactions
- Quality gate before production deployment

### Configuration

**Railway Environment Name:** `staging`

**Environment Variables:**
```
BUN_ENV=staging
DATABASE_URL=${{Postgres-Staging.DATABASE_URL}}
```

**Branch:** `staging`

**Deployment:**
- Auto-deploys on push to `staging` branch
- Runs migrations automatically on deployment
- Seeds development data on deployment

### URL

https://stag.play-smith.com

### Testing Checklist

After deploying to staging, verify:

- [ ] Deployment completed successfully in Railway
- [ ] Database migrations ran without errors
- [ ] Application loads at https://stag.play-smith.com
- [ ] Login functionality works
- [ ] Critical features tested (create play, save playbook, etc.)
- [ ] No console errors in browser
- [ ] API endpoints responding correctly

---

## Production Environment

### Purpose

Live environment serving real users.

### Configuration

**Railway Environment Name:** `production`

**Environment Variables:**
```
BUN_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Branch:** `release-1.0`

**Deployment:**
- Manual deployment only (no auto-deploy)
- Requires explicit approval in Railway dashboard
- Tagged with version numbers (e.g., `v1.0.0`)

### URL

https://www.play-smith.com

### Pre-Production Checklist

Before deploying to production:

- [ ] All features tested thoroughly on staging
- [ ] No known critical bugs
- [ ] Database migrations reviewed and tested
- [ ] Performance tested (if applicable)
- [ ] Team sign-off obtained (if required)
- [ ] Rollback plan prepared

### Post-Deployment Verification

After production deployment:

- [ ] Application loads at https://www.play-smith.com
- [ ] SSL certificate valid (green lock icon)
- [ ] Login works with production credentials
- [ ] Database queries functioning
- [ ] No errors in Railway logs
- [ ] Monitor for 15-30 minutes for issues

---

## Environment-Specific Behavior

### Development (`BUN_ENV=development`)
- Hot module reloading enabled
- Detailed error messages
- Console logging enabled
- Development data seeding

### Staging (`BUN_ENV=staging`)
- Similar to production behavior
- Development data seeding on deploy
- More verbose logging than production
- Test accounts available

### Production (`BUN_ENV=production`)
- Optimized builds
- Minimal logging (errors only)
- Production-grade security headers
- Real customer data

---

## Switching Between Environments

### Local Development → Staging

```bash
# Test locally
bun run dev

# Commit changes
git add .
git commit -m "Add feature"
git push origin main

# Deploy to staging
git checkout staging
git merge main
git push origin staging  # Triggers auto-deploy
```

### Staging → Production

```bash
# Test on staging first
# Visit: https://stag.play-smith.com

# Merge to production
git checkout release-1.0
git merge staging
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin release-1.0
git push origin v1.0.1

# Manually deploy in Railway dashboard
```

---

## See Also

**Deployment Documentation:**
- [Infrastructure](./infrastructure.md) - Railway, DNS, SSL setup
- [Branch Strategy](./branch-strategy.md) - Git workflow details
- [Deployment README](./README.md) - Overview and quick reference

**Development:**
- [Architecture](../guides/architecture.md) - Technical architecture
