import { HelpCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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
		<div className="relative inline-block" ref={tooltipRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
				aria-label="Targeting mode help"
			>
				<HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
			</button>

			{isOpen && (
				<div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50">
					<h4 className="font-semibold text-sm mb-3">Targeting Modes</h4>

					<div className="space-y-3 text-xs">
						<div>
							<div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
								Absolute Role
							</div>
							<p className="text-gray-600 dark:text-gray-400 mb-2">
								Assign routes to specific player roles (X, Y, Z, etc.)
							</p>
							<div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
								<span className="font-mono text-green-600 dark:text-green-400">
									Example: X runs Post, Y runs Corner
								</span>
							</div>
						</div>

						<div>
							<div className="font-semibold text-purple-600 dark:text-purple-400 mb-1">
								Relative Selector
							</div>
							<p className="text-gray-600 dark:text-gray-400 mb-2">
								Assign routes based on player position (leftmost, inside, etc.)
							</p>
							<div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
								<span className="font-mono text-green-600 dark:text-green-400">
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
