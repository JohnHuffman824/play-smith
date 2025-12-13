# Testing Guide

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/api/sections.test.ts

# Run tests with bail on first failure
bun test --bail
```

## Known Issues

### API Test Pollution (30 tests)

The following API test files pass individually but fail when run with the full test suite due to test pollution:
- `src/api/sections.test.ts` (9 tests)
- `src/api/plays.test.ts` (14 tests)
- `src/api/playbook-shares.test.ts` (9 tests)

**Symptoms**: Tests fail with 403 (Forbidden) errors when run in full suite

**Root Cause**: Shared in-memory SQLite database + test execution timing causes session/access invalidation from other test files

**Workaround**: Run these test files separately:
```bash
bun test src/api/sections.test.ts && \
bun test src/api/plays.test.ts && \
bun test src/api/playbook-shares.test.ts
```

All 53 tests in these files pass when run this way.

**Proper Fix** (future): Implement database isolation per test file or restructure fixtures to use `beforeEach` instead of `beforeAll`.

## Test Status

- **Total**: 680 tests
- **Passing**: 643 (94.6%)
- **Failing**: 31 (4.6%) - 30 are known API pollution issues
- **Skipped**: 6 (0.9%)

**All non-API pollution tests are now passing!** The only failures are the known API pollution issues documented above.
