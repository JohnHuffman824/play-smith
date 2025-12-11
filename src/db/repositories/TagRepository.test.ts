import { describe, test, expect } from 'bun:test'
import { TagRepository } from './TagRepository'

describe('TagRepository', () => {
	const tagRepo = new TagRepository()

	test('getPresetTags returns preset tags', async () => {
		const tags = await tagRepo.getPresetTags()
		expect(tags.length).toBe(10)
		expect(tags.every(t => t.is_preset)).toBe(true)
	})
})
