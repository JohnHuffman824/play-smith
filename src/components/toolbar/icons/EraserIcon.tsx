import svgPaths from '@/imports/eraser-icon.svg.ts'

interface EraserIconProps {
	size?: number
	className?: string
}

/**
 * Custom eraser icon using SVG paths.
 * Shared between main Toolbar and ConceptToolbar.
 */
export function EraserIcon({ size = 22, className }: EraserIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox='0 0 235 235'
			fill='none'
			stroke='currentColor'
			strokeWidth='21.3333'
			strokeLinecap='round'
			strokeLinejoin='round'
			className={className}
		>
			<path
				clipRule='evenodd'
				d={svgPaths.p28898e00}
				fillRule='evenodd'
			/>
			<path d={svgPaths.p3a238100} />
		</svg>
	)
}
