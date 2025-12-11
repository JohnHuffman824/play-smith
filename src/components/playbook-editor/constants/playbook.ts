// Play Types
export const PLAY_TYPE_PASS = 'Pass'
export const PLAY_TYPE_RUN = 'Run'

// View Modes
export const VIEW_MODE_GRID = 'grid'
export const VIEW_MODE_LIST = 'list'

// Filter Types
export const FILTER_ALL = 'all'
export const FILTER_FORMATIONS = 'formations'
export const FILTER_TAGS = 'tags'

// UI Constants
export const MAX_VISIBLE_TAGS = 4
export const DEFAULT_PLAYBOOK_NAME = 'Offensive Game Plan - Week 1'

// Play Type Badge Styles
export const PLAY_TYPE_BADGE_PASS = 'bg-blue-500/90 text-white'
export const PLAY_TYPE_BADGE_RUN = 'bg-green-500/90 text-white'

// Play Type List Styles
export const PLAY_TYPE_LIST_PASS = 'bg-blue-500/10 text-blue-500'
export const PLAY_TYPE_LIST_RUN = 'bg-green-500/10 text-green-500'

// Common Class Names
export const BUTTON_BASE = 'p-2 hover:bg-accent rounded-lg transition-all duration-200'
export const MENU_ITEM_BASE = 'w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-200 flex items-center gap-2'
export const MODAL_BUTTON_BASE = 'px-4 py-2 hover:bg-accent rounded-lg transition-all duration-200'
export const PRIMARY_BUTTON_BASE = 'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200'

// Personnel Options
export const PERSONNEL_OPTIONS = ['11', '10', '12', '13', '21', '22'] as const

// Tag Colors (from design document)
export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'Short Yardage': { bg: 'bg-green-500/15', text: 'text-green-600 dark:text-green-400' },
  'Mid Yardage': { bg: 'bg-yellow-500/15', text: 'text-yellow-600 dark:text-yellow-400' },
  'Long Yardage': { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
  'Redzone': { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  'Red Zone': { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  '3rd Down': { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
  'Quick Game': { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400' },
  'Play Action': { bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
  'Bootleg': { bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400' },
  'Power': { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  'Goal Line': { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400' },
  'Fade': { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
  'Draw': { bg: 'bg-lime-500/15', text: 'text-lime-600 dark:text-lime-400' },
  'Mesh': { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400' },
}

export const DEFAULT_TAG_COLOR = { bg: 'bg-muted', text: 'text-muted-foreground' }

export const TAG_COLOR_PALETTE = [
	{ name: 'Green', value: '#10B981' },
	{ name: 'Yellow', value: '#FBBF24' },
	{ name: 'Orange', value: '#F97316' },
	{ name: 'Red', value: '#EF4444' },
	{ name: 'Rose', value: '#F43F5E' },
	{ name: 'Blue', value: '#3B82F6' },
	{ name: 'Purple', value: '#8B5CF6' },
	{ name: 'Indigo', value: '#6366F1' },
	{ name: 'Teal', value: '#14B8A6' },
	{ name: 'Cyan', value: '#06B6D4' },
	{ name: 'Pink', value: '#EC4899' },
	{ name: 'Amber', value: '#F59E0B' },
]

const HEX_TO_TAILWIND: Record<string, { bg: string; text: string }> = {
	'#10B981': { bg: 'bg-green-500/15', text: 'text-green-600 dark:text-green-400' },
	'#FBBF24': { bg: 'bg-yellow-500/15', text: 'text-yellow-600 dark:text-yellow-400' },
	'#F97316': { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
	'#EF4444': { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
	'#F43F5E': { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400' },
	'#3B82F6': { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
	'#8B5CF6': { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400' },
	'#6366F1': { bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
	'#14B8A6': { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400' },
	'#06B6D4': { bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400' },
	'#EC4899': { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
	'#F59E0B': { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
}

export function getTagClasses(hexColor: string): { bg: string; text: string } {
	return HEX_TO_TAILWIND[hexColor.toUpperCase()] || DEFAULT_TAG_COLOR
}
