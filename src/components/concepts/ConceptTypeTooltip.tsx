import { HelpCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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
		<div className="relative inline-block" ref={tooltipRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="p-1 hover:bg-accent rounded transition-colors"
				aria-label="Concept type help"
			>
				<HelpCircle className="w-4 h-4 text-muted-foreground" />
			</button>

			{isOpen && (
				<div className="absolute left-0 bottom-full mb-2 w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-50">
					<h4 className="font-semibold text-sm mb-3">Concept Types</h4>

					<div className="space-y-3 text-xs">
						<div>
							<div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
								Motion
							</div>
							<p className="text-muted-foreground mb-2">
								Pre-snap player movement that occurs before the ball is snapped. Motion paths are displayed as dotted lines and animate before routes execute.
							</p>
							<div className="bg-secondary p-2 rounded">
								<span className="font-mono text-green-600 dark:text-green-400 text-xs">
									Examples: Jet, Orbit, Return
								</span>
							</div>
						</div>

						<div>
							<div className="font-semibold text-purple-600 dark:text-purple-400 mb-1">
								Modifier
							</div>
							<p className="text-muted-foreground mb-2">
								Adjusts player positions within an existing formation. Modifiers move players closer or farther from the formation center.
							</p>
							<div className="bg-secondary p-2 rounded">
								<span className="font-mono text-green-600 dark:text-green-400 text-xs">
									Examples: Tight, Nasty, Wide
								</span>
							</div>
						</div>

						<div className="pt-2 border-t border-border">
							<p className="text-muted-foreground italic">
								Note: A concept can be either Motion or Modifier, but not both.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
