import { SessionRepository } from '../../db/repositories/SessionRepository'

const sessionRepo = new SessionRepository()

export async function getSessionUser(req: Request): Promise<number | null> {
	const cookie = req.headers.get('Cookie')
	if (!cookie) return null

	const sessionMatch = cookie.match(/session=([^;]+)/)
	if (!sessionMatch) return null

	const session = await sessionRepo.findValidByToken(sessionMatch[1])
	if (!session) return null

	return session.user_id
}
