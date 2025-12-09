import { PathSegment, Drawing, ControlPoint } from '../types/drawing.types'

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
	basePoints: Record<string, ControlPoint>
	baseSegments: PathSegment[]
	params: DrawingTemplateParam[]
}

export const DRAWING_TEMPLATES: DrawingTemplate[] = [
	{
		id: 'slant',
		name: 'Slant',
		basePoints: {
			's0': { id: 's0', x: 0, y: 0, type: 'start' },
			's1': { id: 's1', x: 3, y: 5, type: 'corner' },
		},
		baseSegments: [
			{
				type: 'line',
				pointIds: ['s0', 's1'],
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
		basePoints: {
			'p0': { id: 'p0', x: 0, y: 0, type: 'start' },
			'p1': { id: 'p1', x: 5, y: 12, type: 'corner' },
			'p2': { id: 'p2', x: 15, y: 25, type: 'end' },
		},
		baseSegments: [
			{
				type: 'line',
				pointIds: ['p0', 'p1', 'p2'],
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

	// Deep clone the point pool
	const points: Record<string, ControlPoint> = {}
	for (const [id, point] of Object.entries(template.basePoints)) {
		points[id] = {
			...point,
			handleIn: point.handleIn ? { ...point.handleIn } : undefined,
			handleOut: point.handleOut ? { ...point.handleOut } : undefined,
		}
	}

	// Clone segments (pointIds are just strings, no deep clone needed)
	const segments = template.baseSegments.map((segment) => ({
		type: segment.type,
		pointIds: [...segment.pointIds],
	}))

	return {
		id: `drawing-${templateId}-${Date.now()}`,
		points,
		segments,
		style,
		annotations: [],
		templateId: template.id,
		templateParams: Object.fromEntries(
			template.params.map((p) => [p.name, p.default]),
		),
	}
}
