import { UserRepository } from './repositories/UserRepository'
import { AuthService } from '../services/AuthService'

const ADMIN_EMAIL = 'admin'
const ADMIN_NAME = 'Admin User'
const ADMIN_PASSWORD = 'ALtt98xzH!'

// Seeds the dev database with an admin user for testing
async function seedDevAdmin(): Promise<void> {
	const userRepo = new UserRepository()
	const authService = new AuthService()

	const existing = await userRepo.findByEmail(ADMIN_EMAIL)
	if (existing) {
		console.warn('✓ Admin user already exists, skipping seed')
		return
	}

	const passwordHash = await authService.hashPassword(ADMIN_PASSWORD)
	const user = await userRepo.create({
		email: ADMIN_EMAIL,
		name: ADMIN_NAME,
		password_hash: passwordHash,
	})

	console.warn(`✓ Created admin user: ${user.email} (id: ${user.id})`)
	console.warn('  Login with: admin / ALtt98xzH!')
}

seedDevAdmin()
	.then(() => process.exit(0))
	.catch(err => {
		console.error('✗ Seed failed:', err)
		process.exit(1)
	})
