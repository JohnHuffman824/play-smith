interface BrushSizeSelectorProps {
	brushSize: number
	sizes: Array<{ size: number; label: string }>
	onChange: (_size: number) => void
}

export function BrushSizeSelector({ brushSize, sizes, onChange }: BrushSizeSelectorProps) {
	return (
		<div className="drawing-properties-button-group-2col">
			{sizes.map((brush) => (
				<button
					key={brush.size}
					onClick={() => onChange(brush.size)}
					className="drawing-properties-brush-button"
					data-active={brushSize === brush.size}
				>
					<div className="drawing-properties-brush-content">
						<div
							className="drawing-properties-brush-dot"
							style={{ width: `${brush.size * 2}px`, height: `${brush.size * 2}px` }}
						/>
						<span className="drawing-properties-brush-label">{brush.label}</span>
					</div>
				</button>
			))}
		</div>
	)
}
