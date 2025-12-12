import type { RoleDefinition, SelectorDefinition, RelativeSelector } from '../types/concept.types'

// Chip type constants - eliminates magic strings
export const CHIP_TYPE_FORMATION = 'formation' as const
export const CHIP_TYPE_CONCEPT = 'concept' as const
export const CHIP_TYPE_CONCEPT_GROUP = 'concept_group' as const
export const CHIP_TYPE_TEXT = 'text' as const

// Entity type constants for API responses
export const ENTITY_TYPE_FORMATION = 'formation' as const
export const ENTITY_TYPE_CONCEPT = 'concept' as const
export const ENTITY_TYPE_CONCEPT_GROUP = 'concept_group' as const

// Dialog mode constants
export const DIALOG_MODE_CREATE = 'create' as const
export const DIALOG_MODE_EDIT = 'edit' as const
export const DIALOG_MODE_SAVE_AS = 'save-as' as const

// Scope constants
export const SCOPE_TEAM = 'team' as const
export const SCOPE_PLAYBOOK = 'playbook' as const

// Targeting mode constants
export const TARGETING_MODE_ABSOLUTE = 'absolute_role' as const
export const TARGETING_MODE_RELATIVE = 'relative_selector' as const

// Ball position constants
export const BALL_POSITION_LEFT = 'left' as const
export const BALL_POSITION_CENTER = 'center' as const
export const BALL_POSITION_RIGHT = 'right' as const

// Play direction constants
export const PLAY_DIRECTION_LEFT = 'left' as const
export const PLAY_DIRECTION_RIGHT = 'right' as const
export const PLAY_DIRECTION_NA = 'na' as const

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

export const CHIP_STYLES = {
	formation: 'bg-secondary text-secondary-foreground border-border',
	concept: 'bg-secondary text-secondary-foreground border-border',
	concept_group: 'bg-secondary text-secondary-foreground border-border',
	text: 'bg-secondary text-secondary-foreground border-border'
} as const
