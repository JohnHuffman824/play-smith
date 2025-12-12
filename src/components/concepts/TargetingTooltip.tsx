import { HelpCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import './targeting-tooltip.css'

export function TargetingTooltip() {
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
		<div className="targeting-tooltip" ref={tooltipRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="targeting-tooltip-button"
				aria-label="Targeting mode help"
			>
				<HelpCircle className="w-4 h-4 targeting-tooltip-icon" />
			</button>

			{isOpen && (
				<div className="targeting-tooltip-popover">
					<h4 className="targeting-tooltip-title">Targeting Modes</h4>

					<div className="targeting-tooltip-content">
						<div>
							<div className="targeting-tooltip-item-title">
								Absolute Role
							</div>
							<p className="targeting-tooltip-item-description">
								Assign routes to specific player roles (X, Y, Z, etc.)
							</p>
							<div className="targeting-tooltip-example">
								<span className="targeting-tooltip-example-text">
									Example: X runs Post, Y runs Corner
								</span>
							</div>
						</div>

						<div>
							<div className="targeting-tooltip-item-title">
								Relative Selector
							</div>
							<p className="targeting-tooltip-item-description">
								Assign routes based on player position (leftmost, inside, etc.)
							</p>
							<div className="targeting-tooltip-example">
								<span className="targeting-tooltip-example-text">
									Example: Leftmost receiver runs Post, Inside receivers run Curl
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
