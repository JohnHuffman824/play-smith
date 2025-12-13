import { useTheme } from '@/contexts/SettingsContext'
import './color-swatch-indicator.css'

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

	return (
		<div
			className="color-swatch-indicator"
			data-theme={theme}
			style={{ backgroundColor: color }}
		/>
	)
}
