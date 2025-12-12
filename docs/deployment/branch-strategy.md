# Branch Strategy

## Overview

PlaySmith uses a three-branch strategy: `main` for development, `staging` for integration testing, and `release-1.0` for production.

---

## Branch Structure

```
main          → Primary development branch (local work)
  ↓
staging       → Integration testing branch (Railway staging)
  ↓
release-1.0   → Production release branch (Railway production)
```

---

## Branch Purposes

### `main` - Active Development

**Purpose:** Day-to-day development work

**Characteristics:**
- Feature branches merge here
- Pushed to GitHub but not auto-deployed
- Should compile and pass tests
- May contain unreleased features

**When to use:**
- All development work
- Feature implementation
- Bug fixes
- Code refactoring

### `staging` - Integration Testing

**Purpose:** Integration of features ready for testing

**Characteristics:**
- Auto-deploys to Railway staging environment
- Should always be in a releasable state
- Receives merges from `main`
- Quality gate before production

**When to use:**
- After completing a feature on `main`
- Before merging to production
- To test integrations between multiple features
- To verify database migrations in production-like environment

### `release-1.0` - Production

**Purpose:** Current production code

**Characteristics:**
- Only receives merges from `staging`
- Manually deployed to Railway production
- Tagged with version numbers (e.g., `v1.0.0`)
- Protected by GitHub branch rules

**When to use:**
- Production deployments
- Hotfixes (emergency bug fixes)

---

## Branch Protection

### GitHub Settings

**`release-1.0` branch:**
- Requires pull request approvals
- Direct pushes restricted
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

### When to Deploy

- After completing a feature on `main`
- Before merging to production
- To test integrations between multiple features
- To verify database migrations

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
- [ ] Critical features tested
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

### When to Use Hotfixes

For critical bugs in production that need immediate fixing.

### Hotfix Process

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

### When to Roll Back

If a deployment causes critical issues in production.

### Option 1: Redeploy Previous Version (Fastest)

1. Railway Dashboard → Production Environment → Deployments
2. Find the last working deployment
3. Click "⋮" menu → "Redeploy"
4. Confirm redeployment

### Option 2: Git Rollback (More Control)

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

### Option 3: Deploy Previous Tag

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

## Git Best Practices

### Commit Messages

**Format:**
```
<type>: <short description>

[Optional longer description]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/tooling changes

**Examples:**
```
feat: Add user notifications system

fix: Resolve login redirect loop

refactor: Extract form validation logic
```

### Git Commands Reference

```bash
# Check current branch
git branch

# View recent commits
git log --oneline -10

# Check remote branches
git branch -r

# View git status
git status

# Discard local changes
git reset --hard HEAD

# View changes before committing
git diff
```

---

## See Also

**Deployment Documentation:**
- [Environments](./environments.md) - Environment setup and configuration
- [Infrastructure](./infrastructure.md) - Railway, DNS, SSL
- [Deployment README](./README.md) - Overview and quick reference

**Development:**
- [Architecture](../guides/architecture.md) - Technical architecture
