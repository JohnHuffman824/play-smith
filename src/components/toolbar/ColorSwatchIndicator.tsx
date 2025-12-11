import { useTheme } from '../../contexts/ThemeContext'

interface ColorSwatchIndicatorProps {
	color: string
}

/**
 * Small colored circle indicator that appears on color picker buttons.
 * Positioned at bottom-right of button.
 * Shared between main Toolbar and ConceptToolbar.
 */
export function ColorSwatchIndicator({ color }: ColorSwatchIndicatorProps) {
	const { theme } = useTheme()

	const swatchClass = [
		'absolute -right-1 -bottom-1 w-4 h-4 rounded-full',
		'border-2 shadow-sm',
	].join(' ')

	return (
		<div
			className={`${swatchClass} ${
				theme === 'dark' ? 'border-gray-800' : 'border-white'
			}`}
			style={{ backgroundColor: color }}
		/>
	)
}
