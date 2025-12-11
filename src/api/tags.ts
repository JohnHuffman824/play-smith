import { getSessionUser } from './middleware/auth'
import { db } from '../db/connection'
import { TagRepository } from '../db/repositories/TagRepository'

const tagRepo = new TagRepository()

export const tagsAPI = {
	listPresets: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const tags = await tagRepo.getPresetTags()
		return Response.json({ tags })
	},

	listTeamTags: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const teamId = parseInt(req.params.teamId)
		if (isNaN(teamId)) return Response.json({ error: 'Invalid team ID' }, { status: 400 })
		const tags = await tagRepo.getTeamTags(teamId)
		return Response.json({ tags })
	},

	create: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const teamId = parseInt(req.params.teamId)
		if (isNaN(teamId)) return Response.json({ error: 'Invalid team ID' }, { status: 400 })
		const body = await req.json()
		if (!body.name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })
		if (!body.color) return Response.json({ error: 'Color required' }, { status: 400 })
		try {
			const tag = await tagRepo.create({ team_id: teamId, name: body.name.trim(), color: body.color, created_by: userId })
			return Response.json({ tag }, { status: 201 })
		} catch (e: any) {
			if (e.code === '23505') return Response.json({ error: 'Tag exists' }, { status: 409 })
			throw e
		}
	},

	update: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const tagId = parseInt(req.params.tagId)
		if (isNaN(tagId)) return Response.json({ error: 'Invalid tag ID' }, { status: 400 })
		const body = await req.json()
		const tag = await tagRepo.update(tagId, body)
		if (!tag) return Response.json({ error: 'Not found or preset' }, { status: 404 })
		return Response.json({ tag })
	},

	delete: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const tagId = parseInt(req.params.tagId)
		if (isNaN(tagId)) return Response.json({ error: 'Invalid tag ID' }, { status: 400 })
		const deleted = await tagRepo.delete(tagId)
		if (!deleted) return Response.json({ error: 'Not found or preset' }, { status: 404 })
		return new Response(null, { status: 204 })
	}
}

export const playTagsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const playId = parseInt(req.params.playId)
		if (isNaN(playId)) return Response.json({ error: 'Invalid play ID' }, { status: 400 })
		const tags = await tagRepo.getPlayTags(playId)
		return Response.json({ tags })
	},

	set: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const playId = parseInt(req.params.playId)
		if (isNaN(playId)) return Response.json({ error: 'Invalid play ID' }, { status: 400 })
		const body = await req.json()
		if (!Array.isArray(body.tag_ids)) return Response.json({ error: 'tag_ids array required' }, { status: 400 })
		await tagRepo.setPlayTags(playId, body.tag_ids)
		const tags = await tagRepo.getPlayTags(playId)
		return Response.json({ tags })
	}
}

export const playbookTagsAPI = {
	list: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		const tags = await tagRepo.getPlaybookTags(playbookId)
		return Response.json({ tags })
	},

	set: async (req: Request) => {
		const userId = await getSessionUser(req)
		if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
		const playbookId = parseInt(req.params.playbookId)
		if (isNaN(playbookId)) return Response.json({ error: 'Invalid playbook ID' }, { status: 400 })
		const body = await req.json()
		if (!Array.isArray(body.tag_ids)) return Response.json({ error: 'tag_ids array required' }, { status: 400 })
		await tagRepo.setPlaybookTags(playbookId, body.tag_ids)
		const tags = await tagRepo.getPlaybookTags(playbookId)
		return Response.json({ tags })
	}
}
