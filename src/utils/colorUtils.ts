/**
 * Calculate the relative luminance of a color (WCAG formula)
 */
function getColorLuminance(hexColor: string): number {
	// Remove # if present
	const hex = hexColor.replace('#', '')

	// Parse RGB values
	const r = parseInt(hex.substring(0, 2), 16) / 255
	const g = parseInt(hex.substring(2, 4), 16) / 255
	const b = parseInt(hex.substring(4, 6), 16) / 255

	// Apply gamma correction (WCAG formula)
	const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
	const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
	const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

	// Calculate relative luminance
	return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB
}

/**
 * Adjust drawing colors for theme visibility
 * - Very light colors (like white) become dark in light mode
 * - Very dark colors (like black) become light in dark mode
 * - Mid-range colors stay the same
 */
export function getThemeAwareColor(color: string, theme: 'light' | 'dark'): string {
	const luminance = getColorLuminance(color)

	// Very light color (luminance > 0.9) - likely white or near-white
	const isVeryLight = luminance > 0.9
	// Very dark color (luminance < 0.1) - likely black or near-black
	const isVeryDark = luminance < 0.1

	// Switch very light colors to black in light mode (for visibility)
	if (isVeryLight && theme === 'light') {
		return '#000000'
	}

	// Switch very dark colors to white in dark mode (for visibility)
	if (isVeryDark && theme === 'dark') {
		return '#FFFFFF'
	}

	// Keep mid-range colors as-is
	return color
}
