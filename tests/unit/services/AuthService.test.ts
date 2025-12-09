import { describe, it, expect, beforeEach } from 'bun:test'
import { AuthService } from '../../../src/services/AuthService'

describe('AuthService', () => {
	let authService: AuthService

	beforeEach(() => {
		authService = new AuthService()
	})

	describe('hashPassword', () => {
		it('returns a bcrypt hash different from input', async () => {
			const password = 'testpassword123'
			const hash = await authService.hashPassword(password)

			expect(hash).not.toBe(password)
			expect(hash).toMatch(/^\$2[aby]\$/)
			expect(hash.length).toBeGreaterThan(50)
		})

		it('generates different hashes for same password', async () => {
			const password = 'testpassword123'
			const hash1 = await authService.hashPassword(password)
			const hash2 = await authService.hashPassword(password)

			expect(hash1).not.toBe(hash2)
		})
	})

	describe('verifyPassword', () => {
		it('returns true for matching password', async () => {
			const password = 'testpassword123'
			const hash = await authService.hashPassword(password)

			const result = await authService.verifyPassword(password, hash)

			expect(result).toBe(true)
		})

		it('returns false for non-matching password', async () => {
			const hash = await authService.hashPassword('correct')

			const result = await authService.verifyPassword('wrong', hash)

			expect(result).toBe(false)
		})
	})

	describe('generateSessionToken', () => {
		it('generates 64-character hex token', () => {
			const token = authService.generateSessionToken()

			expect(token).toHaveLength(64)
			expect(token).toMatch(/^[a-f0-9]+$/)
		})

		it('generates unique tokens', () => {
			const token1 = authService.generateSessionToken()
			const token2 = authService.generateSessionToken()

			expect(token1).not.toBe(token2)
		})
	})
})
