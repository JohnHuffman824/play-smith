# Play Smith

An American football play and playbook creator built with Bun, React, and TypeScript. Play Smith provides a digital whiteboard for coaches to design plays, organize them into playbooks, and manage their offensive and defensive schemes.

## Features

- **Interactive Whiteboard**: Design plays on a college-spec football field (160 feet wide with accurate hash marks and yard lines)
- **Tool Suite**: Select, add players, draw routes and formations, add pre-defined routes, and save reusable components
- **Playbook Management**: Organize plays into playbooks with a Google Drive-inspired interface
- **User Authentication**: Secure login system to manage personal plays and playbooks
- **Team Collaboration**: Share playbooks across teams with role-based permissions
- **Cloud-Ready**: PostgreSQL on AWS RDS for production with PostGIS spatial support

## Tech Stack

- **Runtime**: Bun
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Bun HTTP server with REST API
- **Database**: PostgreSQL (local or AWS RDS) with PostGIS extension
- **Testing**: Bun test runner with Happy DOM

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3.3 or higher
- AWS RDS PostgreSQL instance (see setup below)

### Quick Start for Development

Follow these steps to get PlaySmith running locally:

#### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd play-smith
bun install
```

#### 2. Set Up AWS RDS Database

**First time setup:**

Run the interactive setup script (only prompts for password):

```bash
bun setup-rds.ts
```

This will:
- Connect to your AWS RDS instance
- Enable PostGIS and PostGIS Topology extensions
- Verify the installation
- Show you the connection string for `.env`

**Configuration:**
- Host: `playsmith-dev.c940uiy0ypml.us-east-2.rds.amazonaws.com`
- Username: `playsmith_admin`
- Database: `playsmith_dev`
- Password: _(you'll be prompted)_

**Note:** Your `.env` file should already be configured. If not, create it:

```bash
# .env
DATABASE_URL=postgres://playsmith_admin:YOUR_PASSWORD@playsmith-dev.c940uiy0ypml.us-east-2.rds.amazonaws.com:5432/playsmith_dev?sslmode=require
```

For detailed RDS setup instructions, see: [`docs/AWS-RDS-Setup.md`](docs/AWS-RDS-Setup.md)

#### 3. Run Database Migrations

```bash
bun run migrate
```

This will create all necessary tables (users, teams, playbooks, plays, etc.)

#### 4. Start the Development Server

```bash
bun dev
```

Or with hot reload:

```bash
bun --hot src/index.ts
```

The application will be available at `http://localhost:3000`

### Development Workflow

**Daily development:**
```bash
# 1. Pull latest changes
git pull

# 2. Install any new dependencies
bun install

# 3. Run migrations (if database schema changed)
bun run migrate

# 4. Start dev server
bun dev
```

**Testing changes:**
```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test
bun test path/to/test.test.ts
```

### Production

Build and run for production:

```bash
bun start
```

### Troubleshooting

**"Cannot connect to database"**
- Run `bun setup-rds.ts` to verify connection and re-enable PostGIS
- Check your `.env` file has the correct `DATABASE_URL`
- Verify your IP is allowed in RDS security group `playsmith-dev-sg`
- Ensure RDS instance status is "Available" in AWS Console

**"Migration failed"**
- Check database connection works: `bun setup-rds.ts`
- Verify PostGIS is enabled (script will show this)
- Check migration files in `src/db/migrations/`

**"Tests failing"**
- Ensure database migrations are up to date: `bun run migrate`
- Check test database connection in test files
- Run tests individually to isolate issues: `bun test path/to/test.test.ts`

**Need help?**
- See [AWS RDS Setup Guide](docs/AWS-RDS-Setup.md) for detailed database setup
- Check [GitHub Issues](https://github.com/jackhuffman/play-smith/issues) for known issues

---

## 📚 Additional Documentation

**Database:**
- [AWS RDS Setup Guide](docs/AWS-RDS-Setup.md) - Complete RDS PostgreSQL setup
- [Database Architecture](docs/DatabaseArchitecture.md) - Schema and table design
- [PostgreSQL Decision](docs/plans/2024-12-09-postgresql-decision.md) - Why PostgreSQL + RDS

**Implementation Plans:**
- [PostgreSQL Migration Plan](docs/plans/2024-12-09-postgresql-migration-plan.md) - MySQL to PostgreSQL migration

**Design:**
- [PlaySmith Design Document](docs/PlaySmithDesignDocument.md) - Feature specifications

## Project Structure

```
play-smith/
├── src/
│   ├── components/     # React components
│   ├── domain/         # Shared types and domain models
│   ├── server/         # Backend API and routes
│   ├── state/          # Frontend state management
│   └── api/            # API client
├── tests/              # Test suites
└── docs/               # Documentation and plans
```

## Development Status

**Current Phase:** Database Architecture Phase 1
- ✅ PostgreSQL database architecture designed
- ✅ AWS RDS setup guide completed
- 🔄 Migration from MySQL to PostgreSQL in progress
- 📋 Core tables: users, teams, playbooks, plays
- 📋 Next: Players, drawings, and spatial geometry tables

**Upcoming:**
- Authentication system
- Frontend whiteboard implementation
- Team collaboration features

## Bug Tracker

Please report issues via [GitHub Issues](https://github.com/jackhuffman/play-smith/issues) (if repository is created).

## Author & Contact

**Jack Huffman**  
Email: jackhuffman4242@gmail.com  
Domain: [play-smith.com](https://play-smith.com)

## License

© 2025 Jack Huffman. All rights reserved.

## Acknowledgments

Built with [Bun](https://bun.sh) - a fast all-in-one JavaScript runtime.
