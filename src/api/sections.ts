import { PlaybookRepository } from '../db/repositories/PlaybookRepository'
import { SectionRepository } from '../db/repositories/SectionRepository'
import { getSessionUser } from './middleware/auth'
import { checkPlaybookAccess } from './utils/checkPlaybookAccess'

const playbookRepo = new PlaybookRepository()
const sectionRepo = new SectionRepository()

export const sectionsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const sections = await sectionRepo.findByPlaybookId(playbookId)

		return Response.json({ sections })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) {
			return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		}

		const { hasAccess, playbook } = await checkPlaybookAccess(playbookId, userId)
		if (!playbook) {
			return Response.json({ error: 'Playbook not found' }, { status: 404 })
		}
		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const { name } = body

		// Validate required fields
		if (!name) {
			return Response.json(
				{ error: 'name is required' },
				{ status: 400 }
			)
		}

		// Get existing sections to determine next display_order
		const existingSections = await sectionRepo.findByPlaybookId(playbookId)
		const nextDisplayOrder = existingSections.length > 0
			? Math.max(...existingSections.map(s => s.display_order)) + 1
			: 0

		// Create section
		const section = await sectionRepo.create(playbookId, name, nextDisplayOrder)

		return Response.json({ section }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const sectionId = parseInt(req.params.sectionId)
		if (isNaN(sectionId)) {
			return Response.json({ error: 'Invalid section ID' }, { status: 400 })
		}

		const section = await sectionRepo.findById(sectionId)
		if (!section) {
			return Response.json({ error: 'Section not found' }, { status: 404 })
		}

		const { hasAccess } = await checkPlaybookAccess(section.playbook_id, userId)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		const body = await req.json()
		const updated = await sectionRepo.update(sectionId, body)

		return Response.json({ section: updated })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const sectionId = parseInt(req.params.sectionId)
		if (isNaN(sectionId)) {
			return Response.json({ error: 'Invalid section ID' }, { status: 400 })
		}

		const section = await sectionRepo.findById(sectionId)
		if (!section) {
			return Response.json({ error: 'Section not found' }, { status: 404 })
		}

		const { hasAccess } = await checkPlaybookAccess(section.playbook_id, userId)

		if (!hasAccess) {
			return Response.json({ error: 'Access denied' }, { status: 403 })
		}

		await sectionRepo.delete(sectionId)

		return new Response(null, { status: 204 })
	}
}
