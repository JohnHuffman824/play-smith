# Test Server Implementation

## Summary

Implemented approach 3 from the test failure analysis: refactored integration tests to use a test harness that starts the server in-process rather than requiring a manually-started external server.

## Problem

Integration tests were failing because they required a server running on `http://localhost:3000`, but no server was started:

```
error: Unable to connect. Is the computer able to access the url?
  path: "http://localhost:3000/api/auth/login",
  code: "ConnectionRefused"
```

**14 tests were failing:**
- All Auth API integration tests (12 tests)
- 2 Complete Auth Flow integration tests

## Solution

Created a test harness (`tests/helpers/test-server.ts`) that:

1. **Starts server programmatically** - Uses Bun's `serve()` API to start a test server
2. **Random port allocation** - Binds to port 0 to get a random available port
3. **Automatic lifecycle** - Starts in `beforeAll()`, stops in `afterAll()`
4. **No port conflicts** - Each test suite can have its own server instance
5. **No manual setup** - Tests are self-contained and don't require external processes

### Test Harness API

```typescript
// Start a test server on a random available port
const { server, url } = await startTestServer()

// Get the current test server URL
const url = getTestServerUrl()

// Stop the test server
await stopTestServer()
```

## Changes Made

### 1. Created Test Harness

**File:** `tests/helpers/test-server.ts`

- Exports `startTestServer()` - starts server on random port
- Exports `stopTestServer()` - stops the running server
- Exports `getTestServerUrl()` - gets the current server URL
- Singleton pattern prevents multiple servers
- Disables HMR in test mode

### 2. Updated Integration Tests

**Files Updated:**
- `tests/integration/auth-api.test.ts` (12 tests)
- `tests/integration/auth-flow.test.ts` (3 tests)

**Changes:**
- Import test harness functions
- Start server in `beforeAll()` hook
- Stop server in `afterAll()` hook
- Replace hardcoded `http://localhost:3000` with dynamic `${baseUrl}`

### 3. Updated Package.json Scripts

Added convenience scripts for running tests:

```json
"test:all": "bun test --allow-network",      // Run all tests
"test:unit": "bun test tests/unit",          // Unit tests only (no network)
"test:integration": "bun test tests/integration --allow-network",
"test:watch": "bun test --watch --allow-network",
"test:coverage": "bun test --coverage --allow-network"
```

### 4. Updated Documentation

**README.md updates:**
- Added note about `--allow-network` flag requirement
- Documented test server architecture
- Updated troubleshooting section
- Added examples of running different test types

## Requirements

### Network Permission

Integration tests require the `--allow-network` flag because:
- Server needs to bind to a local port (even though it's localhost)
- HTTP requests are made to the test server
- Database connections use network sockets

**Command line:**
```bash
bun test --allow-network
```

**Or use helper script:**
```bash
bun run test:all
```

**Unit tests don't need network:**
```bash
bun test tests/unit  # No --allow-network needed
```

## Test Results

**Before fix:** 14 tests failing (ConnectionRefused errors)

**After fix:** All 165 tests passing ✅

```
 165 pass
 0 fail
 363 expect() calls
Ran 165 tests across 23 files. [10.60s]
```

### Test Breakdown

- **12 Auth API tests** - Now passing
- **3 Complete Auth Flow tests** - Now passing (2 were failing)
- **Unit tests** - Still passing (unaffected)
- **Database repository tests** - Still passing (unaffected)

## Benefits

1. **No manual setup** - Tests start their own server
2. **No port conflicts** - Random port allocation
3. **Faster CI/CD** - No need to start external processes
4. **Self-contained** - Each test suite can have its own server
5. **Better isolation** - Server state doesn't leak between test runs
6. **Easier onboarding** - New developers just run `bun run test:all`

## Technical Details

### Port Allocation

Using `port: 0` tells Bun to automatically select an available port:

```typescript
testServer = serve({
	port: 0, // Use random available port
	routes: { /* ... */ },
	development: false, // Disable HMR in tests
})
```

### Server Lifecycle

```typescript
beforeAll(async () => {
	// Start test server once for entire test suite
	const { url } = await startTestServer()
	baseUrl = url
})

afterAll(async () => {
	// Clean up test server
	await stopTestServer()
})
```

### Example Test Update

**Before:**
```typescript
const response = await fetch('http://localhost:3000/api/auth/login', {
	method: 'POST',
	body: JSON.stringify({ email, password }),
})
```

**After:**
```typescript
const response = await fetch(`${baseUrl}/api/auth/login`, {
	method: 'POST',
	body: JSON.stringify({ email, password }),
})
```

## Future Improvements

Potential enhancements:

1. **Shared test server** - Start one server for all integration tests instead of per-suite
2. **Test database** - Create isolated test database per run
3. **Request mocking** - Consider mocking some API calls for faster tests
4. **Parallel execution** - Bun's test runner could run tests in parallel with isolated servers

## Migration Guide

If you have other integration tests that make HTTP requests:

1. Import the test harness:
   ```typescript
   import { startTestServer, stopTestServer } from '../helpers/test-server'
   ```

2. Add server lifecycle hooks:
   ```typescript
   let baseUrl: string

   beforeAll(async () => {
   	const { url } = await startTestServer()
   	baseUrl = url
   })

   afterAll(async () => {
   	await stopTestServer()
   })
   ```

3. Replace hardcoded URLs:
   ```typescript
   // Before: 'http://localhost:3000/api/endpoint'
   // After:
   `${baseUrl}/api/endpoint`
   ```

4. Run with network flag:
   ```bash
   bun test your-test.test.ts --allow-network
   ```

## Notes

- The test server configuration matches production server exactly
- Server is only created when needed (integration tests)
- Unit tests continue to work without network permissions
- Each test suite has its own server instance (no shared state)

## References

- Bun `serve()` API: https://bun.sh/docs/api/http
- Original issue: Integration tests failing with ConnectionRefused
- Implementation approach: In-process test server with random port allocation
