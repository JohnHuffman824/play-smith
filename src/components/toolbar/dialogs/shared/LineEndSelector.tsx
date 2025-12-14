interface LineEndSelectorProps {
	lineEnd: 'none' | 'arrow' | 'tShape'
	onChange: (_end: 'none' | 'arrow' | 'tShape') => void
}

export function LineEndSelector({ lineEnd, onChange }: LineEndSelectorProps) {
	return (
		<div className="drawing-properties-button-group-grid">
			<button
				onClick={() => onChange('none')}
				className="drawing-properties-line-end-text"
				data-active={lineEnd === 'none'}
			>
				None
			</button>
			<button
				onClick={() => onChange('arrow')}
				className="drawing-properties-line-end-icon"
				data-active={lineEnd === 'arrow'}
			>
				<svg width="20" height="16" viewBox="0 0 20 16">
					<line
						x1="2"
						y1="8"
						x2="11"
						y2="8"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					/>
					<path d="M14 8l-4-4v8z" fill="currentColor" />
				</svg>
			</button>
			<button
				onClick={() => onChange('tShape')}
				className="drawing-properties-line-end-icon"
				data-active={lineEnd === 'tShape'}
			>
				<svg
					width="20"
					height="16"
					viewBox="0 0 20 16"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M14 4v8M2 8h12" />
				</svg>
			</button>
		</div>
	)
}
