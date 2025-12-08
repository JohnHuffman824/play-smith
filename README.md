# Play Smith

An American football play and playbook creator built with Bun, React, and TypeScript. Play Smith provides a digital whiteboard for coaches to design plays, organize them into playbooks, and manage their offensive and defensive schemes.

## Features

- **Interactive Whiteboard**: Design plays on a college-spec football field (160 feet wide with accurate hash marks and yard lines)
- **Tool Suite**: Select, add players, draw routes and formations, add pre-defined routes, and save reusable components
- **Playbook Management**: Organize plays into playbooks with a Google Drive-inspired interface
- **User Authentication**: Secure login system to manage personal plays and playbooks
- **Flexible Storage**: Start with SQLite for local development, switch to MySQL for production (self-hosted or cloud)

## Tech Stack

- **Runtime**: Bun
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Bun HTTP server with REST API
- **Database**: SQLite (development) / MySQL (production)
- **Testing**: Bun test runner with Happy DOM

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3.3 or higher

### Installation

Install dependencies:

```bash
bun install
```

### Development

Start the development server with hot module reloading:

```bash
bun --hot index.ts
```

Or use the dev script:

```bash
bun dev
```

The application will be available at `http://localhost:3000` (or the configured port).

### Production

Build and run for production:

```bash
bun start
```

### Testing

Run the complete test suite:

```bash
bun test
```

Run tests in watch mode:

```bash
bun test --watch
```

Run specific test file:

```bash
bun test path/to/test-file.test.ts
```

## Database Configuration

### SQLite (Default)

No configuration needed. The application creates `playsmith.db` automatically.

### MySQL

Set environment variables to use MySQL:

```bash
export DB_ENGINE=mysql
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=playsmith
export DB_PASSWORD=your_password
export DB_NAME=playsmith
```

MySQL can point to:
- Self-hosted server (e.g., spare PC on your network)
- Cloud provider (e.g., Amazon RDS) - cloud migration is a separate operational task

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

## Known Issues

- Authentication system is planned but not yet implemented
- MySQL repository implementation is in progress
- Cloud deployment configuration is deferred to a later phase

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
