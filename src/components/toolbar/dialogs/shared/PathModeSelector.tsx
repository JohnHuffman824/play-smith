interface PathModeSelectorProps {
	pathMode: 'sharp' | 'curve'
	onChange: (_mode: 'sharp' | 'curve') => void
}

export function PathModeSelector({ pathMode, onChange }: PathModeSelectorProps) {
	return (
		<div className="drawing-properties-button-group">
			<button
				onClick={() => onChange('sharp')}
				className="drawing-properties-option-button"
				data-active={pathMode === 'sharp'}
			>
				<svg viewBox="0 0 48 16" className="drawing-properties-path-svg">
					<polyline
						points="4,12 16,4 32,12 44,4"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="miter"
					/>
				</svg>
			</button>
			<button
				onClick={() => onChange('curve')}
				className="drawing-properties-option-button"
				data-active={pathMode === 'curve'}
			>
				<svg viewBox="0 0 48 16" className="drawing-properties-path-svg">
					<path
						d="M 4,12 C 10,4 22,4 24,8 C 26,12 38,12 44,4"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					/>
				</svg>
			</button>
		</div>
	)
}
