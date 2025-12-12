# Play Smith Deployment Guide

**Last Updated:** December 2024

This guide covers the complete deployment workflow for Play Smith, including local development, staging deployments, and production releases.

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Setup](#environment-setup)
3. [Branch Strategy](#branch-strategy)
4. [Daily Development Workflow](#daily-development-workflow)
5. [Deploying to Staging](#deploying-to-staging)
6. [Deploying to Production](#deploying-to-production)
7. [Hotfix Workflow](#hotfix-workflow)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Infrastructure

- **Hosting:** Railway (https://railway.app)
- **Domain:** play-smith.com (Squarespace DNS)
- **Database:** PostgreSQL 17.7 on Railway
- **Runtime:** Bun v1.3+

### Environments

| Environment | Branch | URL | Auto-Deploy | Database |
|------------|--------|-----|-------------|----------|
| Local | `main` | http://localhost:3000 | N/A | Railway staging or local |
| Staging | `staging` | https://stag.play-smith.com | ✅ Yes | Railway staging DB |
| Production | `release-1.0` | https://www.play-smith.com | ❌ No (manual) | Railway production DB |

---

## Environment Setup

### Local Development

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

### Railway Environments

Both staging and production are configured in the same Railway project with separate environments.

**Staging Environment:**
- **Environment Name:** `staging`
- **Branch:** `staging`
- **Variables:**
  - `BUN_ENV=staging`
  - `DATABASE_URL=${{Postgres-Staging.DATABASE_URL}}`

**Production Environment:**
- **Environment Name:** `production`
- **Branch:** `release-1.0`
- **Variables:**
  - `BUN_ENV=production`
  - `DATABASE_URL=${{Postgres.DATABASE_URL}}`

---

## Branch Strategy

### Branch Structure

```
main          → Primary development branch (local work)
  ↓
staging       → Integration testing branch (Railway staging)
  ↓
release-1.0   → Production release branch (Railway production)
```

### Branch Purposes

**`main`** - Active development
- Your day-to-day development work
- Feature branches merge here
- Pushed to GitHub but not auto-deployed

**`staging`** - Integration testing
- Integration of features ready for testing
- Auto-deploys to Railway staging environment
- Should always be in a releasable state

**`release-1.0`** - Production
- Current production code
- Only receives merges from `staging`
- Manually deployed to Railway production
- Tagged with version numbers (e.g., `v1.0.0`)

### Branch Protection

**GitHub Settings:**
- `release-1.0` requires pull request approvals
- Direct pushes to `release-1.0` are restricted
- Status checks must pass before merging

---

## Daily Development Workflow

### Option 1: Working Directly on Main

For small, straightforward changes:

```bash
# 1. Ensure you're on main and up-to-date
git checkout main
git pull origin main

# 2. Make your changes
# ... edit files ...

# 3. Test locally
bun run dev

# 4. Commit and push
git add .
git commit -m "Add new feature"
git push origin main
```

### Option 2: Using Feature Branches

For larger, isolated features:

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/user-notifications

# 2. Develop and test
# ... edit files ...
bun run dev

# 3. Commit changes
git add .
git commit -m "Implement user notifications"
git push origin feature/user-notifications

# 4. Merge to main when ready
git checkout main
git merge feature/user-notifications
git push origin main

# 5. Delete feature branch
git branch -d feature/user-notifications
git push origin --delete feature/user-notifications
```

---

## Deploying to Staging

### When to Deploy to Staging

- After completing a feature on `main`
- Before merging to production
- To test integrations between multiple features
- To verify database migrations in a production-like environment

### Deployment Process

```bash
# 1. Ensure main is in good state
git checkout main
bun run dev  # Test locally first

# 2. Switch to staging branch
git checkout staging
git pull origin staging

# 3. Merge main into staging
git merge main

# 4. Push to trigger auto-deployment
git push origin staging

# 5. Monitor deployment in Railway
# Railway Dashboard → Staging Environment → Deployments
# Watch logs for migration success and server startup

# 6. Test on staging URL
# Visit: https://stag.play-smith.com
# Test functionality, run through critical paths
```

### Verification Checklist

After deploying to staging:

- [ ] Deployment completed successfully in Railway
- [ ] Database migrations ran without errors
- [ ] Application loads at https://stag.play-smith.com
- [ ] Login functionality works
- [ ] Critical features tested (create play, save playbook, etc.)
- [ ] No console errors in browser
- [ ] API endpoints responding correctly

---

## Deploying to Production

### Pre-Production Checklist

Before deploying to production:

- [ ] All features tested thoroughly on staging
- [ ] No known critical bugs
- [ ] Database migrations reviewed and tested
- [ ] Performance tested (if applicable)
- [ ] Team sign-off obtained (if required)
- [ ] Rollback plan prepared

### Production Deployment Process

```bash
# 1. Ensure staging is stable
# Test thoroughly on https://stag.play-smith.com

# 2. Switch to production branch
git checkout release-1.0
git pull origin release-1.0

# 3. Merge staging into production
git merge staging

# 4. Tag the release
git tag -a v1.0.1 -m "Release v1.0.1 - [brief description]"

# 5. Push branch and tag
git push origin release-1.0
git push origin v1.0.1

# 6. Manually deploy in Railway
# - Railway Dashboard → Production Environment
# - Click "Deployments" tab
# - Click "Deploy" button
# - Confirm deployment

# 7. Monitor deployment
# Watch logs for successful migration and startup

# 8. Verify production
# Visit: https://www.play-smith.com
# Quick smoke test of critical functionality
```

### Post-Deployment Verification

- [ ] Application loads at https://www.play-smith.com
- [ ] SSL certificate valid (green lock icon)
- [ ] Login works with production credentials
- [ ] Database queries functioning
- [ ] No errors in Railway logs
- [ ] Monitor for 15-30 minutes for issues

### Deployment Communication

For team deployments, communicate:

```
🚀 Production Deployment - v1.0.1

Changes:
- [List major features/fixes]

Deployed by: [Your name]
Deployed at: [Timestamp]
Rollback available: v1.0.0

Status: ✅ Successful
```

---

## Hotfix Workflow

For critical bugs in production that need immediate fixing:

### Process

```bash
# 1. Create hotfix branch from production
git checkout release-1.0
git pull origin release-1.0
git checkout -b hotfix/critical-login-bug

# 2. Fix the bug
# ... make minimal changes to fix issue ...

# 3. Test locally
bun run dev

# 4. Merge to production first (critical path)
git checkout release-1.0
git merge hotfix/critical-login-bug

# 5. Tag hotfix version
git tag -a v1.0.2 -m "Hotfix v1.0.2 - Fix critical login bug"

# 6. Push and deploy to production
git push origin release-1.0
git push origin v1.0.2
# Manually deploy in Railway

# 7. Merge back to staging
git checkout staging
git merge hotfix/critical-login-bug
git push origin staging

# 8. Merge back to main (keep in sync!)
git checkout main
git merge hotfix/critical-login-bug
git push origin main

# 9. Clean up
git branch -d hotfix/critical-login-bug
git push origin --delete hotfix/critical-login-bug
```

### Important Notes

- Always merge hotfixes back to staging and main
- Document hotfixes in commit messages and tags
- Test hotfixes thoroughly even though urgent
- Communicate hotfix deployments to team

---

## Rollback Procedures

### Rolling Back a Deployment

If a deployment causes issues:

**Option 1: Redeploy Previous Version (Fastest)**

1. Railway Dashboard → Production Environment → Deployments
2. Find the last working deployment
3. Click "⋮" menu → "Redeploy"
4. Confirm redeployment

**Option 2: Git Rollback (More Control)**

```bash
# 1. Find the last good commit
git log release-1.0 --oneline
# Note the commit hash of last working version

# 2. Revert to that commit
git checkout release-1.0
git reset --hard <commit-hash>

# 3. Force push (⚠️ use with caution)
git push origin release-1.0 --force

# 4. Manually deploy in Railway
```

**Option 3: Deploy Previous Tag**

```bash
# 1. List tags to find previous version
git tag -l

# 2. Check out previous tag
git checkout v1.0.0

# 3. Force update release branch
git checkout release-1.0
git reset --hard v1.0.0

# 4. Force push
git push origin release-1.0 --force

# 5. Manually deploy in Railway
```

### Post-Rollback Steps

1. Verify rollback succeeded
2. Investigate root cause of failure
3. Fix issues on `main` branch
4. Test thoroughly on staging
5. Redeploy to production when fixed

---

## Troubleshooting

### Common Issues

#### "DATABASE_URL environment variable is required"

**Cause:** Missing database connection string in Railway environment

**Fix:**
1. Railway → Select environment (staging or production)
2. Click your app service → Variables tab
3. Add new variable → Reference
4. Select PostgreSQL database → DATABASE_URL

#### Build Fails with "Node.js 18 has reached End-Of-Life"

**Cause:** Railway trying to use Node.js instead of Bun

**Fix:**
Ensure `nixpacks.toml` exists in repository root:
```toml
[phases.setup]
nixPkgs = ["bun"]

[phases.install]
cmds = ["bun install"]

[start]
cmd = "bun src/db/migrate.ts && bun run seed:dev && bun run start"
```

#### SSL Certificate Not Provisioning

**Cause:** DNS not properly configured or not propagated

**Fix:**
1. Verify DNS records in Squarespace:
   - `www.play-smith.com` CNAME → Railway URL
   - `stag.play-smith.com` CNAME → Railway staging URL
2. Check DNS propagation: https://dnschecker.org
3. Wait 10-30 minutes for propagation
4. Railway will auto-provision SSL once DNS resolves

#### Migration Fails on Deployment

**Cause:** Database migration error

**Fix:**
1. Check Railway logs for specific error
2. Common fixes:
   - Duplicate migration IDs: Rename migration files
   - Missing `IF NOT EXISTS`: Add to migration SQL
   - Permission errors: Check database user permissions
3. Fix migration files
4. Commit and push
5. Redeploy

#### Deployment Succeeds but Site Shows 500 Error

**Cause:** Runtime error in application

**Fix:**
1. Check Railway deployment logs
2. Look for error stack traces
3. Common issues:
   - Missing environment variables
   - Database connection errors
   - Code errors (undefined variables, etc.)
4. Fix code on appropriate branch
5. Push and redeploy

### Getting Help

**Railway Support:**
- Dashboard: Check deployment logs first
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app

**Debugging Commands:**

```bash
# Check current branch
git branch

# View recent commits
git log --oneline -10

# Check remote branches
git branch -r

# View git status
git status

# Test database connection locally
bun test-railway-connection.ts

# Run migrations locally
bun run migrate

# Check Railway deployment status (with Railway CLI)
railway status
railway logs
```

---

## Quick Reference

### Essential Commands

```bash
# Development
bun run dev              # Start dev server with hot reload
bun run migrate          # Run database migrations
bun run seed:dev         # Seed development data
bun test                 # Run test suite

# Deployment
git checkout staging && git merge main && git push origin staging
git checkout release-1.0 && git merge staging && git push origin release-1.0

# Railway CLI (optional)
railway login            # Authenticate with Railway
railway link             # Link to Railway project
railway logs             # View deployment logs
railway status           # Check deployment status
```

### Important URLs

- **Production:** https://www.play-smith.com
- **Staging:** https://stag.play-smith.com
- **Railway Dashboard:** https://railway.app/dashboard
- **GitHub Repository:** https://github.com/JohnHuffman824/play-smith
- **Domain Management:** Squarespace

### Contact

For deployment issues or questions:
- Check this guide first
- Review Railway deployment logs
- Consult team documentation
- Escalate critical production issues immediately

---

**End of Deployment Guide**
