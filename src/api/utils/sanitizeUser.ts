import type { User } from '../../db/types'

/**
 * Removes password_hash from user object to prevent exposure
 * in API responses
 */
export function sanitizeUser(user: User): Omit<User, 'password_hash'> {
	const { password_hash: _password_hash, ...publicUser } = user
	return publicUser
}

/**
 * Removes password_hash from array of user objects
 */
export function sanitizeUsers(users: User[]): Omit<User, 'password_hash'>[] {
	return users.map(sanitizeUser)
}
