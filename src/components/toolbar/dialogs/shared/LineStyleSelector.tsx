interface LineStyleSelectorProps {
	lineStyle: 'solid' | 'dashed'
	onChange: (_style: 'solid' | 'dashed') => void
}

export function LineStyleSelector({ lineStyle, onChange }: LineStyleSelectorProps) {
	return (
		<div className="drawing-properties-button-group">
			<button
				onClick={() => onChange('solid')}
				className="drawing-properties-option-button"
				data-active={lineStyle === 'solid'}
			>
				<div className="drawing-properties-line-solid" />
			</button>
			<button
				onClick={() => onChange('dashed')}
				className="drawing-properties-option-button"
				data-active={lineStyle === 'dashed'}
			>
				<div className="drawing-properties-line-dashed">
					<div className="drawing-properties-line-dashed-segment" />
					<div className="drawing-properties-line-dashed-segment" />
					<div className="drawing-properties-line-dashed-segment" />
				</div>
			</button>
		</div>
	)
}
