// Global type declarations for Bun-specific extensions

declare global {
	interface Request {
		params: Record<string, string>
	}
}

export {}
