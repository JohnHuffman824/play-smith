import type { ReactNode } from 'react'
import { Tooltip } from './Tooltip'
import { useTheme } from '@/contexts/SettingsContext'

interface ToolButtonProps {
	icon: ReactNode
	label: string
	isSelected?: boolean
	onClick: () => void
	disabled?: boolean
	dataAttribute?: string
}

/**
 * Shared toolbar button component used by both main Toolbar and ConceptToolbar.
 * Provides consistent styling, sizing, and interaction patterns.
 */
export function ToolButton({
	icon,
	label,
	isSelected = false,
	onClick,
	disabled = false,
	dataAttribute
}: ToolButtonProps) {
	const baseButtonClass = [
		'w-14 h-14 rounded-xl flex items-center justify-center',
		'transition-all cursor-pointer',
	].join(' ')

	const buttonClass = isSelected
		? 'bg-blue-500 text-white shadow-lg scale-105'
		: 'bg-secondary text-secondary-foreground hover:bg-accent'

	return (
		<Tooltip content={label}>
			<button
				onClick={onClick}
				disabled={disabled}
				className={`${baseButtonClass} ${buttonClass} ${
					disabled ? 'opacity-50 cursor-not-allowed' : ''
				}`}
				aria-label={label}
				{...(dataAttribute ? { [dataAttribute]: true } : {})}
			>
				{icon}
			</button>
		</Tooltip>
	)
}
