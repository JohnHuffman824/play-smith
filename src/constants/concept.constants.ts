import type { RoleDefinition, SelectorDefinition, RelativeSelector } from '../types/concept.types'

export const PRESET_ROLES: RoleDefinition[] = [
	{ id: 'x', name: 'X', category: 'receiver' },
	{ id: 'y', name: 'Y', category: 'receiver' },
	{ id: 'z', name: 'Z', category: 'receiver' },
	{ id: 'slot', name: 'Slot', category: 'receiver' },
	{ id: 'h', name: 'H-Back', category: 'receiver' },
	{ id: 'te', name: 'TE', category: 'tight_end' },
	{ id: 'qb', name: 'QB', category: 'back' },
	{ id: 'rb', name: 'RB', category: 'back' },
	{ id: 'fb', name: 'FB', category: 'back' },
	{ id: 'lt', name: 'LT', category: 'line' },
	{ id: 'lg', name: 'LG', category: 'line' },
	{ id: 'c', name: 'C', category: 'line' },
	{ id: 'rg', name: 'RG', category: 'line' },
	{ id: 'rt', name: 'RT', category: 'line' }
]

export const RELATIVE_SELECTORS: SelectorDefinition[] = [
	{ id: 'leftmost_receiver', label: 'Leftmost Receiver', hasCount: false },
	{ id: 'rightmost_receiver', label: 'Rightmost Receiver', hasCount: false },
	{ id: 'leftmost_receivers', label: 'Leftmost N Receivers', hasCount: true },
	{ id: 'rightmost_receivers', label: 'Rightmost N Receivers', hasCount: true },
	{ id: 'second_receiver_from_left', label: 'Second Receiver from Left', hasCount: false },
	{ id: 'second_receiver_from_right', label: 'Second Receiver from Right', hasCount: false },
	{ id: 'inside_receivers', label: 'Inside Receivers', hasCount: false },
	{ id: 'outside_receivers', label: 'Outside Receivers', hasCount: false },
	{ id: 'playside_receiver', label: 'Playside Receiver', hasCount: false, requiresPlayDirection: true },
	{ id: 'backside_receiver', label: 'Backside Receiver', hasCount: false, requiresPlayDirection: true },
	{ id: 'playside_tackle', label: 'Playside Tackle', hasCount: false, requiresPlayDirection: true },
	{ id: 'backside_tackle', label: 'Backside Tackle', hasCount: false, requiresPlayDirection: true },
	{ id: 'strong_side_receivers', label: 'Strong Side Receivers', hasCount: false },
	{ id: 'weak_side_receivers', label: 'Weak Side Receivers', hasCount: false },
	{ id: 'strong_side_te', label: 'Strong Side TE', hasCount: false },
	{ id: 'deepest_receiver', label: 'Deepest Receiver', hasCount: false },
	{ id: 'shallow_receivers', label: 'Shallow Receivers', hasCount: false },
	{ id: 'deep_receivers', label: 'Deep Receivers', hasCount: false }
]

export const CHIP_COLORS = {
	formation: 'blue',
	concept: 'green',
	concept_group: 'purple',
	text: 'gray'
} as const

export const CHIP_STYLES = {
	formation: 'bg-blue-100 text-blue-700 border-blue-300',
	concept: 'bg-green-100 text-green-700 border-green-300',
	concept_group: 'bg-purple-100 text-purple-700 border-purple-300',
	text: 'bg-gray-100 text-gray-700 border-gray-300'
} as const

export const CHIP_STYLES_DARK = {
	formation: 'bg-blue-900/30 text-blue-300 border-blue-700',
	concept: 'bg-green-900/30 text-green-300 border-green-700',
	concept_group: 'bg-purple-900/30 text-purple-300 border-purple-700',
	text: 'bg-gray-700 text-gray-300 border-gray-600'
} as const
