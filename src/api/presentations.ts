import { getSessionUser } from './middleware/auth'
import { checkPlaybookAccess } from './utils/checkPlaybookAccess'
import { PresentationRepository } from '../db/repositories/PresentationRepository'

const presentationRepo = new PresentationRepository()

export const presentationsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) {
			return Response.json(
				{ error: 'Invalid playbook ID' },
				{ status: 400 }
			)
		}

		const { hasAccess } = await checkPlaybookAccess(
			playbookId,
			userId
		)
		if (!hasAccess) {
			return Response.json(
				{ error: 'Access denied' },
				{ status: 403 }
			)
		}

		const presentations =
			await presentationRepo.getPlaybookPresentations(playbookId)
		return Response.json({ presentations })
	},

	get: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const presentationId = parseInt(req.params.presentationId)
		if (isNaN(presentationId)) {
			return Response.json(
				{ error: 'Invalid presentation ID' },
				{ status: 400 }
			)
		}

		const presentation = await presentationRepo.findById(
			presentationId
		)
		if (!presentation) {
			return Response.json(
				{ error: 'Presentation not found' },
				{ status: 404 }
			)
		}

		const { hasAccess } = await checkPlaybookAccess(
			presentation.playbook_id,
			userId
		)
		if (!hasAccess) {
			return Response.json(
				{ error: 'Access denied' },
				{ status: 403 }
			)
		}

		const slides = await presentationRepo.getSlides(presentationId)
		return Response.json({ presentation, slides })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) {
			return Response.json(
				{ error: 'Invalid playbook ID' },
				{ status: 400 }
			)
		}

		const { hasAccess } = await checkPlaybookAccess(
			playbookId,
			userId
		)
		if (!hasAccess) {
			return Response.json(
				{ error: 'Access denied' },
				{ status: 403 }
			)
		}

		const body = await req.json()
		if (!body.name) {
			return Response.json(
				{ error: 'name is required' },
				{ status: 400 }
			)
		}

		const presentation = await presentationRepo.create({
			playbook_id: playbookId,
			name: body.name,
			description: body.description || null,
			created_by: userId
		})
		return Response.json({ presentation }, { status: 201 })
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const presentationId = parseInt(req.params.presentationId)
		if (isNaN(presentationId)) {
			return Response.json(
				{ error: 'Invalid presentation ID' },
				{ status: 400 }
			)
		}

		const presentation = await presentationRepo.findById(
			presentationId
		)
		if (!presentation) {
			return Response.json(
				{ error: 'Presentation not found' },
				{ status: 404 }
			)
		}

		const { hasAccess } = await checkPlaybookAccess(
			presentation.playbook_id,
			userId
		)
		if (!hasAccess) {
			return Response.json(
				{ error: 'Access denied' },
				{ status: 403 }
			)
		}

		const body = await req.json()
		const updated = await presentationRepo.update(
			presentationId,
			body
		)

		return Response.json({ presentation: updated })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const presentationId = parseInt(req.params.presentationId)
		if (isNaN(presentationId)) {
			return Response.json(
				{ error: 'Invalid presentation ID' },
				{ status: 400 }
			)
		}

		const presentation = await presentationRepo.findById(
			presentationId
		)
		if (!presentation) {
			return Response.json(
				{ error: 'Presentation not found' },
				{ status: 404 }
			)
		}

		const { hasAccess } = await checkPlaybookAccess(
			presentation.playbook_id,
			userId
		)
		if (!hasAccess) {
			return Response.json(
				{ error: 'Access denied' },
				{ status: 403 }
			)
		}

		await presentationRepo.delete(presentationId)

		return new Response(null, { status: 204 })
	},

	addSlide: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const presentationId = parseInt(req.params.presentationId)
		if (isNaN(presentationId)) {
			return Response.json(
				{ error: 'Invalid presentation ID' },
				{ status: 400 }
			)
		}

		const presentation = await presentationRepo.findById(
			presentationId
		)
		if (!presentation) {
			return Response.json(
				{ error: 'Presentation not found' },
				{ status: 404 }
			)
		}

		const { hasAccess } = await checkPlaybookAccess(
			presentation.playbook_id,
			userId
		)
		if (!hasAccess) {
			return Response.json(
				{ error: 'Access denied' },
				{ status: 403 }
			)
		}

		const body = await req.json()
		if (!body.play_id) {
			return Response.json(
				{ error: 'play_id is required' },
				{ status: 400 }
			)
		}

		const slide = await presentationRepo.addSlide(
			presentationId,
			body.play_id
		)
		return Response.json({ slide }, { status: 201 })
	},

	removeSlide: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const presentationId = parseInt(req.params.presentationId)
		const slideId = parseInt(req.params.slideId)
		if (isNaN(slideId)) {
			return Response.json(
				{ error: 'Invalid slide ID' },
				{ status: 400 }
			)
		}

		const presentation = await presentationRepo.findById(
			presentationId
		)
		if (!presentation) {
			return Response.json(
				{ error: 'Presentation not found' },
				{ status: 404 }
			)
		}

		const { hasAccess } = await checkPlaybookAccess(
			presentation.playbook_id,
			userId
		)
		if (!hasAccess) {
			return Response.json(
				{ error: 'Access denied' },
				{ status: 403 }
			)
		}

		await presentationRepo.removeSlide(slideId)

		return new Response(null, { status: 204 })
	},

	reorderSlides: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) {
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const presentationId = parseInt(req.params.presentationId)
		if (isNaN(presentationId)) {
			return Response.json(
				{ error: 'Invalid presentation ID' },
				{ status: 400 }
			)
		}

		const presentation = await presentationRepo.findById(
			presentationId
		)
		if (!presentation) {
			return Response.json(
				{ error: 'Presentation not found' },
				{ status: 404 }
			)
		}

		const { hasAccess } = await checkPlaybookAccess(
			presentation.playbook_id,
			userId
		)
		if (!hasAccess) {
			return Response.json(
				{ error: 'Access denied' },
				{ status: 403 }
			)
		}

		const body = await req.json()
		if (!Array.isArray(body.slide_orders)) {
			return Response.json(
				{ error: 'slide_orders must be an array' },
				{ status: 400 }
			)
		}

		await presentationRepo.reorderSlides(
			presentationId,
			body.slide_orders
		)
		return Response.json({ success: true })
	}
}
