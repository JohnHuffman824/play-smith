# Infrastructure

## Overview

PlaySmith runs on Railway with PostgreSQL database, Bun runtime, and custom domain configuration through Squarespace DNS.

---

## Railway Configuration

### Project Structure

Both staging and production environments exist in the same Railway project as separate environments.

**Services:**
- Web application (Bun runtime)
- PostgreSQL database (v17.7)

### Environment Variables

**Staging Environment (`staging`):**
```
BUN_ENV=staging
DATABASE_URL=${{Postgres-Staging.DATABASE_URL}}
```

**Production Environment (`production`):**
```
BUN_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Build Configuration

Railway uses Bun instead of Node.js via `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["bun"]

[phases.install]
cmds = ["bun install"]

[start]
cmd = "bun src/db/migrate.ts && bun run seed:dev && bun run start"
```

**Start command does:**
1. Run database migrations
2. Seed development data (staging only)
3. Start application server

---

## DNS Configuration

### Domain Registrar: Squarespace

**DNS Records:**

| Subdomain | Type | Value | Environment |
|-----------|------|-------|-------------|
| `www` | CNAME | Railway production URL | Production |
| `stag` | CNAME | Railway staging URL | Staging |

**Propagation:**
- DNS changes take 10-30 minutes to propagate
- Check propagation: https://dnschecker.org

---

## SSL Certificates

**Provider:** Railway (automatic)

**How it works:**
1. Add custom domain in Railway dashboard
2. Point DNS CNAME to Railway URL
3. Wait for DNS propagation (10-30 minutes)
4. Railway auto-provisions SSL certificate via Let's Encrypt

**Verification:**
- Green lock icon in browser
- Certificate valid for 90 days
- Auto-renews before expiration

**Troubleshooting SSL:**
- Verify DNS records point to correct Railway URL
- Check DNS propagation at https://dnschecker.org
- Wait up to 30 minutes after DNS configuration
- Railway logs will show SSL provisioning status

---

## Database

### PostgreSQL Configuration

**Version:** 17.7
**Provider:** Railway managed PostgreSQL

**Separate databases:**
- Staging database: Isolated test data
- Production database: Live customer data

**Connection:**
- Use `DATABASE_URL` environment variable
- Connection pooling handled by Bun's `Bun.sql`
- Automatic SSL/TLS encryption

### Backups

**Railway Automated Backups:**
- Daily automatic backups
- 7-day retention (free tier)
- Manual backup before major deployments recommended

**Manual Backup:**
```bash
# Export production database
railway run --environment production pg_dump > backup-$(date +%Y%m%d).sql
```

---

## Monitoring

### Railway Dashboard

**Deployment Logs:**
- Real-time application logs
- Migration output
- Error stack traces
- Performance metrics

**Database Metrics:**
- Connection count
- Query performance
- Storage usage
- CPU/Memory usage

### Alerts

Railway can notify on:
- Deployment failures
- Database connection issues
- High resource usage

---

## Troubleshooting

### "DATABASE_URL environment variable is required"

**Cause:** Missing database connection string in Railway environment

**Fix:**
1. Railway → Select environment (staging or production)
2. Click your app service → Variables tab
3. Add new variable → Reference
4. Select PostgreSQL database → DATABASE_URL

### Build Fails with "Node.js 18 has reached End-Of-Life"

**Cause:** Railway trying to use Node.js instead of Bun

**Fix:**
Ensure `nixpacks.toml` exists in repository root with Bun configuration (see above).

### SSL Certificate Not Provisioning

**Cause:** DNS not properly configured or not propagated

**Fix:**
1. Verify DNS records in Squarespace:
   - `www.play-smith.com` CNAME → Railway production URL
   - `stag.play-smith.com` CNAME → Railway staging URL
2. Check DNS propagation: https://dnschecker.org
3. Wait 10-30 minutes for propagation
4. Railway will auto-provision SSL once DNS resolves

### Migration Fails on Deployment

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

### Deployment Succeeds but Site Shows 500 Error

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

---

## Getting Help

**Railway Support:**
- Dashboard: Check deployment logs first
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app

**Debugging Commands:**

```bash
# Check Railway deployment status (with Railway CLI)
railway status
railway logs

# Test database connection locally
bun test-railway-connection.ts

# Run migrations locally
bun run migrate
```

---

## See Also

**Deployment Documentation:**
- [Environments](./environments.md) - Environment setup and configuration
- [Branch Strategy](./branch-strategy.md) - Git workflow and deployments
- [Deployment README](./README.md) - Overview and quick reference

**Database:**
- [Database README](../database/README.md) - Schema and design decisions
