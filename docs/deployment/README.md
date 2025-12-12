# PlaySmith Deployment

## Overview

This directory contains all deployment and infrastructure documentation for PlaySmith.

**Hosting:** Railway (https://railway.app)
**Domain:** play-smith.com (Squarespace DNS)
**Database:** PostgreSQL 17.7 on Railway
**Runtime:** Bun v1.3+

---

## Quick Navigation

| To learn about... | Read |
|-------------------|------|
| Railway setup, DNS, SSL | [Infrastructure](./infrastructure.md) |
| Local, staging, production config | [Environments](./environments.md) |
| Git workflow, deployments, hotfixes | [Branch Strategy](./branch-strategy.md) |

---

## Environment URLs

| Environment | URL | Branch | Auto-Deploy |
|-------------|-----|--------|-------------|
| Production | https://www.play-smith.com | `release-1.0` | ❌ Manual |
| Staging | https://stag.play-smith.com | `staging` | ✅ Auto |
| Local | http://localhost:3000 | `main` | N/A |

---

## Essential Commands

### Development
```bash
bun run dev              # Start dev server with hot reload
bun run migrate          # Run database migrations
bun run seed:dev         # Seed development data
bun test                 # Run test suite
```

### Deployment
```bash
# Deploy to staging
git checkout staging && git merge main && git push origin staging

# Deploy to production
git checkout release-1.0 && git merge staging && git push origin release-1.0
```

### Railway CLI (Optional)
```bash
railway login            # Authenticate with Railway
railway link             # Link to Railway project
railway logs             # View deployment logs
railway status           # Check deployment status
```

---

## Quick Reference

### Important URLs
- **Production:** https://www.play-smith.com
- **Staging:** https://stag.play-smith.com
- **Railway Dashboard:** https://railway.app/dashboard
- **GitHub Repository:** https://github.com/JohnHuffman824/play-smith
- **Domain Management:** Squarespace

### Emergency Contacts
For deployment issues:
1. Check this documentation first
2. Review Railway deployment logs
3. Consult team documentation
4. Escalate critical production issues immediately

---

## See Also

**Deployment Documentation:**
- [Infrastructure Setup](./infrastructure.md) - Railway, DNS, SSL configuration
- [Environments](./environments.md) - Local, staging, production setup
- [Branch Strategy](./branch-strategy.md) - Git workflow and deployment processes

**Related Documentation:**
- [Database Architecture](../database/README.md) - Database schema and design
- [Architecture Guide](../guides/architecture.md) - Technical architecture overview
