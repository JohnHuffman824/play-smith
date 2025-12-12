import { HelpCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import './concept-type-tooltip.css'

export function ConceptTypeTooltip() {
	const [isOpen, setIsOpen] = useState(false)
	const tooltipRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	return (
		<div className="concept-type-tooltip" ref={tooltipRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="concept-type-tooltip-button"
				aria-label="Concept type help"
			>
				<HelpCircle className="w-4 h-4 concept-type-tooltip-icon" />
			</button>

			{isOpen && (
				<div className="concept-type-tooltip-popover">
					<h4 className="concept-type-tooltip-title">Concept Types</h4>

					<div className="concept-type-tooltip-content">
						<div>
							<div className="concept-type-tooltip-item-title">
								Motion
							</div>
							<p className="concept-type-tooltip-item-description">
								Pre-snap player movement that occurs before the ball is snapped. Motion paths are displayed as dotted lines and animate before routes execute.
							</p>
							<div className="concept-type-tooltip-example">
								<span className="concept-type-tooltip-example-text">
									Examples: Jet, Orbit, Return
								</span>
							</div>
						</div>

						<div>
							<div className="concept-type-tooltip-item-title">
								Modifier
							</div>
							<p className="concept-type-tooltip-item-description">
								Adjusts player positions within an existing formation. Modifiers move players closer or farther from the formation center.
							</p>
							<div className="concept-type-tooltip-example">
								<span className="concept-type-tooltip-example-text">
									Examples: Tight, Nasty, Wide
								</span>
							</div>
						</div>

						<div className="concept-type-tooltip-note">
							<p className="concept-type-tooltip-note-text">
								Note: A concept can be either Motion or Modifier, but not both.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
