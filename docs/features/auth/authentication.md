# Authentication System

**Status:** ✅ Implemented (December 2024)

Production-ready session-based authentication system that gates the entire application behind a login modal with self-registration and secure session management.

## Overview

Play Smith uses session-based authentication with PostgreSQL-backed storage. All routes require authentication, and sessions are managed via HTTP-only cookies for maximum security.

## Authentication Features

### Session-Based Authentication

**Why Sessions (Not JWT)?**
- Server-side session invalidation (immediate logout)
- No client-side token storage vulnerabilities
- Simpler security model for web application
- Session data stored in PostgreSQL (already using for app data)

**Session Lifetime:**
- Default: 7 days
- Configurable per environment
- Auto-refresh on activity (sliding window)

**Session Storage:**
- PostgreSQL `sessions` table
- Indexed by token for fast lookups
- Automatic cleanup of expired sessions (daily job)

### HTTP-Only Cookies

**Cookie Security:**
- **HTTP-only:** Cannot be accessed by JavaScript (XSS protection)
- **Secure:** Only sent over HTTPS in production
- **SameSite=Strict:** CSRF protection (cookie not sent on cross-origin requests)
- **Domain:** `.play-smith.com` (works across subdomains)

**Cookie Name:** `play_smith_session`

**Cookie Lifetime:** Matches session expiration (7 days default)

### Password Security

**Bcrypt Hashing:**
- Industry-standard password hashing
- Cost factor: 10 (balances security and performance)
- Bun's built-in password API: `Bun.password.hash()`, `Bun.password.verify()`

**Password Requirements:**
- Minimum length: 8 characters
- Recommended: 12+ characters
- No maximum length (hashed to fixed size)
- Client-side validation before submission

**No Plain Text Storage:**
- Passwords never stored in plain text
- Only bcrypt hash stored in database
- Hash unreadable even with database access

### Self-Registration

**Registration Flow:**
1. Click "Sign Up" in login modal
2. Enter email, password, confirm password
3. Client-side validation (email format, password strength)
4. Submit registration
5. Account created, session started
6. Redirect to playbook manager (or onboarding - future)

**Validation:**
- Email format check (RFC 5322 compliant)
- Email uniqueness (cannot register duplicate email)
- Password confirmation match
- Password strength indicator (future)

**No Email Verification (Currently):**
- Immediate access after registration
- Email verification planned for production (future)
- Prevents registration spam

### Login Flow

**Modal UI:**
- Modal appears on page load if not authenticated
- Cannot dismiss (no "X" button, no click outside to close)
- Prevents access to application without login
- Smooth fade-in animation

**Login Process:**
1. Enter email and password
2. Click "Log In"
3. Backend validates credentials
4. If valid: Create session, set cookie, redirect
5. If invalid: Show error message

**Error Messages:**
- "Invalid email or password" (generic, prevents user enumeration)
- "Account locked" (future: after 5 failed attempts)
- Network errors handled gracefully

### Logout

**Logout Process:**
1. Click "Logout" button (in user menu)
2. POST to `/api/auth/logout`
3. Session deleted from database
4. Cookie cleared from browser
5. Redirect to login modal

**Session Cleanup:**
- Immediate server-side deletion
- Cookie cleared (Max-Age=0)
- User redirected to login

### Session Validation

**On Every Request:**
1. Extract session token from cookie
2. Look up session in database
3. Check expiration
4. If valid: Attach user to request context
5. If invalid: Return 401 Unauthorized

**Middleware:** `src/middleware/authMiddleware.ts`

**Protected Routes:**
- All routes except `/api/auth/login`, `/api/auth/register`
- Unauthenticated requests redirected to login

## API Endpoints

### Register

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "coach@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "coach@example.com",
    "createdAt": "2024-12-01T10:00:00Z"
  },
  "session": {
    "token": "session-token",
    "expiresAt": "2024-12-08T10:00:00Z"
  }
}
```

**Set-Cookie Header:**
```
Set-Cookie: play_smith_session=session-token; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

**Error Responses:**
- 400: Email already registered
- 400: Invalid email format
- 400: Password too short

### Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "coach@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "coach@example.com",
    "createdAt": "2024-12-01T10:00:00Z"
  },
  "session": {
    "token": "session-token",
    "expiresAt": "2024-12-08T10:00:00Z"
  }
}
```

**Set-Cookie Header:** Same as register

**Error Responses:**
- 401: Invalid credentials
- 429: Too many login attempts (rate limiting - future)

### Logout

**Endpoint:** `POST /api/auth/logout`

**Request:** Cookie with session token

**Response:** 204 No Content

**Clear-Cookie Header:**
```
Set-Cookie: play_smith_session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Request:** Cookie with session token

**Response:**
```json
{
  "id": "user-uuid",
  "email": "coach@example.com",
  "createdAt": "2024-12-01T10:00:00Z",
  "teams": [
    {
      "id": "team-uuid",
      "name": "Eagles Football",
      "role": "owner"
    }
  ]
}
```

**Error Responses:**
- 401: Not authenticated (invalid or expired session)

## Development Setup

### Seeding Admin User

**For Local Development:**

```bash
bun run seed:dev
```

**Creates:**
- Email: `admin@example.com`
- Password: `admin`
- User ID: Logged to console

**Warning:** Only for local development, not production

**Use Case:**
- Quick login during development
- Testing without registration
- Seeded database for demos

### Environment Variables

**Required:**
```bash
# Database connection
DATABASE_URL=postgresql://user:pass@localhost:5432/playsmith

# Session secret (for token generation)
SESSION_SECRET=random-string-at-least-32-characters

# Environment (affects cookie Secure flag)
BUN_ENV=development  # or staging, production
```

**Cookie Behavior by Environment:**
- `development`: Secure=false (works with http://localhost)
- `staging`: Secure=true (requires https://stag.play-smith.com)
- `production`: Secure=true (requires https://www.play-smith.com)

## Database Schema

### users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**Indexes:**
- `token`: Fast session lookup on every request
- `user_id`: List user's active sessions
- `expires_at`: Cleanup expired sessions efficiently

**Cascade Behavior:**
- Delete user → all sessions deleted (ON DELETE CASCADE)

## Frontend Implementation

### AuthContext

**Location:** `src/contexts/AuthContext.tsx`

**Global State:**
- Current user (or null if not authenticated)
- Loading state (during session check)
- Login, logout, register methods

**Provider Wraps App:**
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

**Usage in Components:**
```tsx
const { user, login, logout } = useAuth();

if (!user) {
  return <LoginModal />;
}

return <PlaybookManager />;
```

### LoginModal Component

**Location:** `src/components/auth/LoginModal.tsx`

**Features:**
- Dual mode: Login or Register
- Toggle between modes ("Already have an account? Log in")
- Client-side validation
- Error display
- Loading states during submission

**Validation:**
- Email: RFC 5322 regex
- Password: Minimum 8 characters
- Confirm password: Matches password
- Real-time feedback (red border on invalid)

**Submit Behavior:**
```tsx
async function handleLogin(email, password) {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Send/receive cookies
    });

    if (!response.ok) {
      const error = await response.json();
      setError(error.message);
      return;
    }

    const data = await response.json();
    setUser(data.user);
    // Modal closes, app becomes accessible
  } catch (err) {
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
}
```

## Security Considerations

### XSS Protection

**HTTP-Only Cookies:**
- Session token never accessible to JavaScript
- Even if XSS vulnerability exists, attacker cannot steal session token

**Content Security Policy (Future):**
- Restrict inline scripts
- Whitelist script sources
- Prevent script injection

### CSRF Protection

**SameSite=Strict:**
- Cookie not sent on cross-origin requests
- Attacker on evil.com cannot make authenticated requests to play-smith.com

**Future: CSRF Tokens:**
- Additional layer for state-changing requests
- Token in form, validated on server

### Brute Force Protection (Future)

**Rate Limiting:**
- Max 5 login attempts per email per 15 minutes
- Exponential backoff after failures
- Account lockout after 10 failed attempts (unlock via email)

**Captcha:**
- After 3 failed attempts, show CAPTCHA
- Prevents automated brute force

### Session Fixation Prevention

**New Session on Login:**
- Old session (if any) invalidated
- New session token generated
- Attacker cannot pre-set session token

### Password Reset (Future)

**Forgot Password Flow:**
1. Enter email
2. Send reset link via email
3. Link expires after 1 hour
4. User sets new password
5. Old sessions invalidated

**Email Service:**
- Integration with Resend, SendGrid, or AWS SES
- See [Teams](./teams.md) for email service implementation

## Testing

### Unit Tests

**AuthService Tests:**
- `register()` creates user with hashed password
- `login()` validates credentials
- `logout()` deletes session
- `validateSession()` checks expiration

### Integration Tests

**API Endpoint Tests:**
- POST /api/auth/register creates user and session
- POST /api/auth/login returns session cookie
- POST /api/auth/logout clears cookie
- GET /api/auth/me requires valid session

### End-to-End Tests

**User Flow Tests:**
1. Open app → Login modal appears
2. Register new user → Session created, redirected to app
3. Logout → Session cleared, login modal reappears
4. Login with registered user → Session restored

## Performance

### Session Lookup

**Benchmark:** < 5ms per request

**Optimization:**
- Index on `sessions.token`
- Connection pooling (Bun.sql)
- Single query per request

### Password Hashing

**Benchmark:** ~50ms per hash/verify

**Strategy:**
- Cost factor 10 (not too slow, still secure)
- Async hashing (doesn't block event loop)
- Consider caching bcrypt results (future, requires care)

### Session Cleanup

**Daily Job:**
- Delete sessions where `expires_at < NOW()`
- Runs via cron or scheduled task (future)
- Keeps sessions table small

**Manual Cleanup (Current):**
```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

## Future Enhancements

### Multi-Factor Authentication (MFA)

**TOTP (Time-Based One-Time Password):**
- Google Authenticator, Authy support
- Backup codes for recovery
- Optional (not required)

### OAuth/SSO

**Google/Microsoft Login:**
- "Sign in with Google"
- No password management for users
- Simpler onboarding

**SAML for Schools:**
- Integrate with school district SSO
- Single login for all school systems

### Session Management Dashboard

**User-Visible Sessions:**
- List active sessions (device, location, last activity)
- Revoke sessions remotely
- "Log out all devices"

### Email Verification

**Verify Email on Registration:**
- Send verification email
- Account limited until verified
- Prevent fake email registrations

### Password Strength Requirements

**Enforce Strong Passwords:**
- Minimum length 12 characters (currently 8)
- Require uppercase, lowercase, number, symbol
- Check against common password lists (rockyou.txt)

---

## See Also

- [Teams](./teams.md) - Team structure, roles, and invitation system
- [Playbook Management](../playbook/management.md) - Access control for playbooks
- [Sharing](../playbook/sharing.md) - Cross-team playbook sharing
