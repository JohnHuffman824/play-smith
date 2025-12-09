// Handles password hashing and session token generation
export class AuthService {
	private static readonly SALT_ROUNDS = 10
	private static readonly TOKEN_BYTES = 32

	// Hashes a plaintext password using bcrypt
	async hashPassword(password: string): Promise<string> {
		return await Bun.password.hash(password, {
			algorithm: 'bcrypt',
			cost: AuthService.SALT_ROUNDS,
		})
	}

	// Verifies a plaintext password against a bcrypt hash
	async verifyPassword(
		password: string,
		hash: string
	): Promise<boolean> {
		return await Bun.password.verify(password, hash)
	}

	// Generates a cryptographically secure session token
	generateSessionToken(): string {
		const bytes = crypto.getRandomValues(
			new Uint8Array(AuthService.TOKEN_BYTES)
		)
		return Array.from(bytes)
			.map(b => b.toString(16).padStart(2, '0'))
			.join('')
	}
}
