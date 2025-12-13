import { describe, test, expect } from 'bun:test'
import { LabelRepository } from './LabelRepository'

describe('LabelRepository', () => {
	const labelRepo = new LabelRepository()

	test('findPresets returns preset labels', async () => {
		const labels = await labelRepo.findPresets()
		expect(labels.length).toBe(10)
		expect(labels.every(l => l.is_preset)).toBe(true)
	})
})
