# AWS RDS PostgreSQL Setup Guide

**Date:** 2024-12-09
**Purpose:** Set up managed PostgreSQL database on AWS RDS for PlaySmith

## 🎯 Quick Start - What You Need To Do

✅ **Steps 1-2: Already completed!**
- RDS instance `playsmith-dev` created
- Security group `playsmith-dev-sg` configured

✅ **Step 3: Already automated!**
- Run `bun setup-rds.ts` to enable PostGIS (done)

✅ **Step 4: Already configured!**
- Your `.env` file has the connection string

### Next Steps for Development:

```bash
# 1. Verify PostGIS is enabled (optional)
bun setup-rds.ts

# 2. Run database migrations
bun run migrate

# 3. Start developing!
bun dev
```

**That's it!** The sections below are reference material for:
- Creating a new RDS instance (if needed)
- Advanced configuration options
- Troubleshooting
- Cost optimization

---

## Overview

This guide walks through setting up a PostgreSQL database on AWS RDS (Relational Database Service) with optimal configuration for PlaySmith's requirements.

---

## Step 1: Create RDS PostgreSQL Instance

✅ **COMPLETED** - Your `playsmith-dev` instance is already created!

### Via AWS Console

1. **Navigate to RDS**
   - Go to AWS Console → Services → RDS
   - Click "Create database"

2. **Choose Database Creation Method**
   - Select: **Standard create** (for full control)

3. **Engine Options**
   - Engine type: **PostgreSQL**
   - Version: **PostgreSQL 15.x** or later (for best performance)
   - ✅ Ensure version supports PostGIS (all recent versions do)

4. **Templates**
   - **Development/Test** (for development environment)
   - **Production** (for production - includes Multi-AZ, automated backups)

5. **Settings**
   - **DB instance identifier**: `playsmith-db` (or `playsmith-dev`, `playsmith-prod`)
   - **Master username**: `playsmith_admin` (recommended)
   - **Master password**: Generate strong password (save securely!)
   - ✅ Enable "Auto generate password" or use a password manager

6. **DB Instance Class**
   - **Development**: `db.t4g.micro` or `db.t4g.small` (burstable, cost-effective)
   - **Production**: `db.t4g.medium` or `db.r6g.large` (consistent performance)
   - ℹ️ Start small, scale up as needed

7. **Storage**
   - **Storage type**: General Purpose SSD (gp3)
   - **Allocated storage**: 20 GB (minimum, auto-scales)
   - ✅ Enable "Storage autoscaling"
   - **Maximum storage threshold**: 100 GB (or higher for production)

8. **Availability & Durability**
   - **Development**: Single AZ
   - **Production**: Multi-AZ deployment (high availability)

9. **Connectivity**
   - **Compute resource**: Don't connect to an EC2 compute resource (manual config)
   - **VPC**: Default VPC (or create custom VPC)
   - **Subnet group**: Default
   - **Public access**:
     - **Yes** for development (access from local machine)
     - **No** for production (access only from VPC/EC2/Lambda)
   - **VPC security group**: Create new
     - **New VPC security group name**: `playsmith-db-sg`
   - **Availability Zone**: No preference

10. **Database Authentication**
    - Select: **Password authentication** (simplest for now)
    - Future: Can enable IAM database authentication

11. **Additional Configuration**
    - **Initial database name**: `playsmith`
    - **DB parameter group**: default.postgres15 (or custom - see below)
    - **Option group**: default:postgres-15
    - **Backup**:
      - **Enable automated backups**: Yes
      - **Backup retention period**: 7 days (dev), 30 days (prod)
      - **Backup window**: Preferred time (e.g., 3:00-4:00 AM UTC)
    - **Encryption**:
      - ✅ Enable encryption (uses AWS KMS)
    - **Performance Insights**:
      - Enable (7 days free, useful for debugging)
    - **Monitoring**:
      - ✅ Enable Enhanced Monitoring (60 second granularity)
    - **Log exports**:
      - ✅ PostgreSQL log
      - ✅ Upgrade log
    - **Maintenance**:
      - ✅ Enable auto minor version upgrade
      - **Maintenance window**: Preferred time (e.g., Sun 4:00-5:00 AM UTC)
    - **Deletion protection**:
      - ✅ Enable for production
      - Optional for development

12. **Click "Create database"**
    - Wait 5-10 minutes for instance to become available
    - Status will change from "Creating" → "Available"

---

## Step 2: Configure Security Group

### Allow Inbound PostgreSQL Access

1. **Navigate to EC2 → Security Groups**
   - Find security group: `playsmith-db-sg` (created in Step 1)

2. **Edit Inbound Rules**
   - Click "Edit inbound rules"

3. **Add Rules:**

   **For Development (Local Access):**
   - Type: PostgreSQL
   - Protocol: TCP
   - Port: 5432
   - Source: **My IP** (your current IP address)
   - Description: "Local development access"

   **For Production (Application Access):**
   - Type: PostgreSQL
   - Protocol: TCP
   - Port: 5432
   - Source: Security group of your application (EC2, ECS, Lambda)
   - Description: "Application server access"

   **Optional: Office/Team Access:**
   - Type: PostgreSQL
   - Protocol: TCP
   - Port: 5432
   - Source: Your office IP range (e.g., 203.0.113.0/24)
   - Description: "Office network access"

4. **Save rules**

⚠️ **Security Best Practice**: Never use `0.0.0.0/0` (all IPs) for production databases!

---

## Step 3: Install PostGIS Extension

✅ **AUTOMATED - Use the setup script!**

Instead of manual psql commands, use the automated setup script:

```bash
bun setup-rds.ts
```

**What it does:**
- Connects to your RDS instance: `playsmith-dev.c940uiy0ypml.us-east-2.rds.amazonaws.com`
- Enables PostGIS and PostGIS Topology extensions
- Verifies installation
- Shows PostGIS version

**You only need to enter your password!**

<details>
<summary>📖 Manual method (reference only - not needed)</summary>

If you prefer to do this manually with psql:

1. **Connect to RDS instance:**
```bash
psql "postgres://playsmith_admin:YOUR_PASSWORD@playsmith-dev.c940uiy0ypml.us-east-2.rds.amazonaws.com:5432/playsmith_dev"
```

2. **Enable PostGIS extension:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify installation
SELECT PostGIS_Version();
```

Expected output: `3.x.x` or similar
</details>

---

## Step 4: Get Connection Details

✅ **ALREADY CONFIGURED!**

Your `.env` file is already set up with the correct connection details:

```bash
DATABASE_URL=postgres://playsmith_admin:YOUR_PASSWORD@playsmith-dev.c940uiy0ypml.us-east-2.rds.amazonaws.com:5432/playsmith_dev?sslmode=require
```

<details>
<summary>📖 Reference: How to find your RDS endpoint (if needed)</summary>

1. **Navigate to RDS → Databases**
   - Click on your database instance (`playsmith-dev`)

2. **Copy Connection Details:**
   - **Endpoint**: `playsmith-dev.xxxxxx.us-east-2.rds.amazonaws.com`
   - **Port**: `5432`
   - **Master username**: `playsmith_admin`
</details>

### Construct Connection String

**Format:**
```
postgres://USERNAME:PASSWORD@ENDPOINT:PORT/DATABASE
```

**Example:**
```
postgres://playsmith_admin:MySecurePassword123!@playsmith-db.abc123xyz.us-east-1.rds.amazonaws.com:5432/playsmith
```

### Update `.env` File

Create/update `.env`:
```bash
DATABASE_URL=postgres://playsmith_admin:YOUR_PASSWORD@playsmith-db.xxxxx.us-east-1.rds.amazonaws.com:5432/playsmith
```

⚠️ **Never commit `.env` to git!** Use `.env.example` for documentation.

---

## Step 5: Connection String Security

### Using AWS Secrets Manager (Recommended for Production)

1. **Store database credentials in AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name playsmith/database \
  --secret-string '{"username":"playsmith_admin","password":"YOUR_PASSWORD","host":"playsmith-db.xxxxx.us-east-1.rds.amazonaws.com","port":"5432","database":"playsmith"}'
```

2. **Retrieve at runtime** (in your application):
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getDatabaseUrl(): Promise<string> {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "playsmith/database" })
  );

  const secret = JSON.parse(response.SecretString!);
  return `postgres://${secret.username}:${secret.password}@${secret.host}:${secret.port}/${secret.database}`;
}
```

3. **Use in environment:**
```bash
# .env (for local dev - override with Secrets Manager in production)
DATABASE_URL=postgres://playsmith_admin:local_password@localhost:5432/playsmith
```

---

## Step 6: SSL/TLS Configuration

RDS PostgreSQL requires SSL for secure connections.

### Download RDS Certificate

```bash
# Download RDS CA certificate bundle
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
mv global-bundle.pem rds-ca-cert.pem
```

### Update Connection String

**With SSL (recommended):**
```
postgres://playsmith_admin:PASSWORD@playsmith-db.xxxxx.us-east-1.rds.amazonaws.com:5432/playsmith?sslmode=require
```

**SSL Modes:**
- `require` - Requires SSL but doesn't verify certificate (simplest)
- `verify-ca` - Requires SSL and verifies certificate against CA
- `verify-full` - Requires SSL and verifies certificate + hostname

**Example with certificate verification:**
```
postgres://playsmith_admin:PASSWORD@playsmith-db.xxxxx.us-east-1.rds.amazonaws.com:5432/playsmith?sslmode=verify-full&sslrootcert=./rds-ca-cert.pem
```

---

## Step 7: Update `.env.example`

Update `/.env.example` with RDS format:

```bash
# Database Configuration
# For local development, use local PostgreSQL:
# DATABASE_URL=postgres://user:password@localhost:5432/playsmith
#
# For AWS RDS (production):
DATABASE_URL=postgres://playsmith_admin:YOUR_PASSWORD@playsmith-db.xxxxx.us-east-1.rds.amazonaws.com:5432/playsmith?sslmode=require
```

---

## Step 8: Test Connection

### From Local Machine

```bash
# Test with psql
psql "postgres://playsmith_admin:YOUR_PASSWORD@playsmith-db.xxxxx.us-east-1.rds.amazonaws.com:5432/playsmith?sslmode=require"

# Run simple query
SELECT version();
```

### With Bun Application

```bash
# Set environment variable
export DATABASE_URL="postgres://playsmith_admin:YOUR_PASSWORD@playsmith-db.xxxxx.us-east-1.rds.amazonaws.com:5432/playsmith?sslmode=require"

# Test connection
bun test src/db/connection.test.ts
```

---

## Step 9: Run Migrations

```bash
# Run migrations on RDS
bun run migrate
```

Expected output:
```
→ Applying migration 001_create_users_teams...
✓ Applied migration 001_create_users_teams
→ Applying migration 002_create_playbooks...
✓ Applied migration 002_create_playbooks
→ Applying migration 003_create_plays...
✓ Applied migration 003_create_plays
✓ All migrations applied successfully
```

---

## RDS Parameter Group Configuration (Optional)

### Create Custom Parameter Group

For optimal PlaySmith performance, create a custom parameter group:

1. **RDS Console → Parameter groups → Create parameter group**
   - **Parameter group family**: postgres15
   - **Type**: DB Parameter Group
   - **Group name**: `playsmith-postgres15`
   - **Description**: Custom parameters for PlaySmith

2. **Modify Parameters:**

```
# Connection settings
max_connections = 100

# Memory settings (adjust based on instance size)
shared_buffers = 256MB          # 25% of RAM for db.t4g.small
effective_cache_size = 768MB    # 75% of RAM

# Query planner
random_page_cost = 1.1          # SSD storage
effective_io_concurrency = 200

# Write-ahead log
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Logging (useful for debugging)
log_statement = 'ddl'           # Log all DDL statements
log_min_duration_statement = 1000  # Log queries slower than 1 second
```

3. **Apply to Database:**
   - RDS → Databases → playsmith-db → Modify
   - **DB parameter group**: playsmith-postgres15
   - **Apply immediately** (or during maintenance window)

---

## Cost Optimization

### Development Environment

- Instance: `db.t4g.micro` (~$15/month)
- Storage: 20 GB gp3 (~$2.5/month)
- **Total**: ~$17-20/month

### Production Environment

- Instance: `db.t4g.medium` Multi-AZ (~$120/month)
- Storage: 50 GB gp3 (~$6/month)
- Backup storage: First 50 GB free
- **Total**: ~$126/month

### Cost-Saving Tips

1. **Use Reserved Instances** (1-3 year commitment for 30-60% savings)
2. **Stop dev instances** when not in use (billing stops, storage cost continues)
3. **Enable storage autoscaling** (pay only for what you use)
4. **Monitor with CloudWatch** (identify unused resources)

---

## Backup & Recovery

### Automated Backups

RDS automatically backs up your database:
- **Backup window**: Set in Step 1
- **Retention**: 7-35 days
- **Point-in-time recovery**: Restore to any second within retention period

### Manual Snapshots

Create manual snapshot:
1. RDS → Databases → playsmith-db
2. Actions → Take snapshot
3. **Snapshot identifier**: `playsmith-db-before-migration-YYYY-MM-DD`

### Restore from Snapshot

1. RDS → Snapshots → Select snapshot
2. Actions → Restore snapshot
3. Configure new instance settings
4. Update `DATABASE_URL` to point to restored instance

---

## Monitoring & Alerts

### CloudWatch Metrics

Key metrics to monitor:
- **CPUUtilization**: Should be < 80%
- **DatabaseConnections**: Track connection pool usage
- **FreeStorageSpace**: Alert when < 10 GB
- **ReadLatency / WriteLatency**: Track query performance

### Create Alarms

1. **CloudWatch → Alarms → Create alarm**

**Example: High CPU Alert**
- Metric: RDS → CPUUtilization
- Conditions: > 80% for 5 minutes
- Actions: Send SNS notification to your email

**Example: Low Storage Alert**
- Metric: RDS → FreeStorageSpace
- Conditions: < 10 GB
- Actions: Send SNS notification

---

## Security Best Practices

### ✅ Implemented

- ✅ Encryption at rest (AWS KMS)
- ✅ Encryption in transit (SSL/TLS)
- ✅ VPC security groups
- ✅ Automated backups
- ✅ Strong master password

### 🔒 Recommended

1. **Use IAM database authentication** (future enhancement)
2. **Rotate credentials regularly** (via Secrets Manager)
3. **Enable deletion protection** (production)
4. **Use private subnets** (production - no public access)
5. **Enable VPC Flow Logs** (audit network traffic)
6. **Regular security patches** (auto minor version upgrade)

---

## Troubleshooting

### Cannot Connect from Local Machine

**Check:**
1. Security group allows your IP on port 5432
2. RDS instance has "Publicly accessible" = Yes
3. VPC route table has internet gateway route
4. Your firewall allows outbound port 5432

**Test connectivity:**
```bash
telnet playsmith-db.xxxxx.us-east-1.rds.amazonaws.com 5432
```

### SSL Connection Issues

**Error: "server does not support SSL"**
- Check connection string includes `?sslmode=require`

**Error: "certificate verify failed"**
- Download RDS CA certificate bundle
- Use `sslmode=require` instead of `verify-full` (or specify certificate)

### Performance Issues

1. **Check CloudWatch metrics** (CPU, memory, connections)
2. **Enable Performance Insights** (analyze slow queries)
3. **Review parameter group settings** (shared_buffers, max_connections)
4. **Scale up instance class** (if consistently high CPU/memory)

---

## Next Steps

After RDS setup:
1. ✅ Update `.env` with RDS connection string
2. ✅ Run migrations: `bun run migrate`
3. ✅ Test connection: `bun test`
4. ✅ Deploy application to AWS (EC2, ECS, or Lambda)
5. 🔒 Store credentials in AWS Secrets Manager (production)
6. 📊 Set up CloudWatch alarms
7. 🔄 Configure backup retention policy

---

## Additional Resources

- [AWS RDS PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [PostGIS on RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Appendix.PostgreSQL.CommonDBATasks.PostGIS.html)
- [RDS Security](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html)
