import { PathSegment, Drawing } from '../types/drawing.types'

export interface DrawingTemplateParam {
	name: string
	default: number
	min: number
	max: number
	unit: 'feet' | 'degrees'
}

export interface DrawingTemplate {
	id: string
	name: string
	baseSegments: PathSegment[]
	params: DrawingTemplateParam[]
}

export const DRAWING_TEMPLATES: DrawingTemplate[] = [
	{
		id: 'slant',
		name: 'Slant',
		baseSegments: [
			{
				type: 'line',
				points: [
					{ id: 's0', x: 0, y: 0, type: 'start' },
					{ id: 's1', x: 3, y: 5, type: 'corner' },
				],
			},
		],
		params: [
			{ name: 'depth', default: 5, min: 3, max: 10, unit: 'feet' },
			{
				name: 'angle',
				default: 45,
				min: 30,
				max: 60,
				unit: 'degrees',
			},
		],
	},
	{
		id: 'post',
		name: 'Post',
		baseSegments: [
			{
				type: 'line',
				points: [
					{ id: 'p0', x: 0, y: 0, type: 'start' },
					{ id: 'p1', x: 5, y: 12, type: 'corner' },
					{ id: 'p2', x: 15, y: 25, type: 'end' },
				],
			},
		],
		params: [
			{
				name: 'breakDepth',
				default: 12,
				min: 8,
				max: 18,
				unit: 'feet',
			},
			{
				name: 'breakAngle',
				default: 35,
				min: 20,
				max: 45,
				unit: 'degrees',
			},
		],
	},
]

/**
 * Builds a new drawing from a template without mutating template data.
 */
export function instantiateTemplate(
	templateId: string,
	style: Drawing['style'],
): Drawing | null {
	const template = DRAWING_TEMPLATES.find((item) => item.id == templateId)
	if (!template) return null

	const segments = template.baseSegments.map((segment) => ({
		type: segment.type,
		points: segment.points.map((point) => ({
			...point,
			handleIn: point.handleIn
				? { ...point.handleIn }
				: undefined,
			handleOut: point.handleOut
				? { ...point.handleOut }
				: undefined,
		})),
	}))

	return {
		id: `drawing-${templateId}-${Date.now()}`,
		segments,
		style,
		annotations: [],
		templateId: template.id,
		templateParams: Object.fromEntries(
			template.params.map((p) => [p.name, p.default]),
		),
	}
}
