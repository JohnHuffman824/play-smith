// Play Types
export const PLAY_TYPE_PASS = 'Pass'
export const PLAY_TYPE_RUN = 'Run'

// View Modes
export const VIEW_MODE_GRID = 'grid'
export const VIEW_MODE_LIST = 'list'

// Filter Types
export const FILTER_ALL = 'all'
export const FILTER_FORMATIONS = 'formations'
export const FILTER_LABELS = 'labels'

// UI Constants
export const MAX_VISIBLE_LABELS = 4
export const DEFAULT_PLAYBOOK_NAME = 'Offensive Game Plan - Week 1'

// These constants are now defined in CSS files:
// - PLAY_TYPE_BADGE_PASS/RUN moved to play-card.css
// - PLAY_TYPE_LIST_PASS/RUN moved to play-list-view.css

// Common Class Names
export const BUTTON_BASE = 'p-2 hover:bg-accent rounded-lg transition-all duration-200'
export const MENU_ITEM_BASE = 'w-full px-4 py-2 text-left hover:bg-accent transition-colors duration-200 flex items-center gap-2'
export const MODAL_BUTTON_BASE = 'px-4 py-2 hover:bg-accent rounded-lg transition-all duration-200'
export const PRIMARY_BUTTON_BASE = 'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200'

// Personnel Options
export const PERSONNEL_OPTIONS = ['11', '10', '12', '13', '21', '22'] as const

// Label Color Palette
export const LABEL_COLOR_PALETTE = [
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

// Label color styles mapping
const HEX_TO_STYLES: Record<string, { bg: string; text: string }> = {
	'#10B981': { bg: 'rgba(16, 185, 129, 0.3)', text: '#10B981' },
	'#FBBF24': { bg: 'rgba(251, 191, 36, 0.3)', text: '#B8860B' },
	'#F97316': { bg: 'rgba(249, 115, 22, 0.3)', text: '#F97316' },
	'#EF4444': { bg: 'rgba(239, 68, 68, 0.3)', text: '#EF4444' },
	'#F43F5E': { bg: 'rgba(244, 63, 94, 0.3)', text: '#F43F5E' },
	'#3B82F6': { bg: 'rgba(59, 130, 246, 0.3)', text: '#3B82F6' },
	'#8B5CF6': { bg: 'rgba(139, 92, 246, 0.3)', text: '#8B5CF6' },
	'#6366F1': { bg: 'rgba(99, 102, 241, 0.3)', text: '#6366F1' },
	'#14B8A6': { bg: 'rgba(20, 184, 166, 0.3)', text: '#14B8A6' },
	'#06B6D4': { bg: 'rgba(6, 182, 212, 0.3)', text: '#0891B2' },
	'#EC4899': { bg: 'rgba(236, 72, 153, 0.3)', text: '#EC4899' },
	'#F59E0B': { bg: 'rgba(245, 158, 11, 0.3)', text: '#D97706' },
}

export function getLabelStyles(hexColor: string): React.CSSProperties {
	const hex = hexColor.toUpperCase()
	const colors = HEX_TO_STYLES[hex]
	if (!colors) {
		return { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
	}
	return {
		backgroundColor: colors.bg,
		color: colors.text,
	}
}
