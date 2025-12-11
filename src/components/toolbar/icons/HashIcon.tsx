interface HashIconProps {
	size?: number
	className?: string
}

/**
 * Hash marker icon showing three horizontal lines.
 * Shared between main Toolbar and ConceptToolbar.
 */
export function HashIcon({ size = 22, className }: HashIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			className={className}
		>
			{/* Three solid horizontal lines stacked vertically */}
			<line x1='4' y1='7' x2='20' y2='7' />
			<line x1='4' y1='12' x2='20' y2='12' />
			<line x1='4' y1='17' x2='20' y2='17' />
		</svg>
	)
}
