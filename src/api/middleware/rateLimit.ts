// Simple in-memory rate limiter for auth endpoints
// For production, consider using Redis-backed rate limiting

interface RateLimitEntry {
	count: number
	resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
	windowMs: number      // Time window in milliseconds
	maxRequests: number   // Max requests per window
}

// Clean up expired entries every minute
setInterval(() => {
	const now = Date.now()
	for (const [key, entry] of rateLimitStore.entries()) {
		if (now > entry.resetTime) {
			rateLimitStore.delete(key)
		}
	}
}, 60000)

export function createRateLimiter(config: RateLimitConfig) {
	return async function checkRateLimit(req: Request): Promise<Response | null> {
		// Disable rate limiting in test environment
		if (process.env.NODE_ENV === 'test') {
			return null
		}

		// Use IP address as key (consider X-Forwarded-For in production behind proxy)
		const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
			|| req.headers.get('x-real-ip')
			|| 'unknown'

		const now = Date.now()
		const key = ip

		let entry = rateLimitStore.get(key)

		if (!entry || now > entry.resetTime) {
			entry = { count: 1, resetTime: now + config.windowMs }
			rateLimitStore.set(key, entry)
			return null // Allow request
		}

		entry.count++

		if (entry.count > config.maxRequests) {
			const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
			return Response.json(
				{ error: 'Too many requests. Please try again later.' },
				{
					status: 429,
					headers: { 'Retry-After': String(retryAfter) }
				}
			)
		}

		return null // Allow request
	}
}

// Pre-configured limiters for auth endpoints
export const loginRateLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000,  // 15 minutes
	maxRequests: 5              // 5 login attempts per 15 minutes
})

export const registerRateLimiter = createRateLimiter({
	windowMs: 60 * 60 * 1000,  // 1 hour
	maxRequests: 3              // 3 registrations per hour per IP
})
