import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import type { Section } from '../../hooks/usePlaybookData'
import type { CallSheetConfig } from '../../types/export.types'

interface CallSheetExportDialogProps {
	open: boolean
	onClose: () => void
	sections: Section[]
	playbookName: string
	playbookId: string
}

export function CallSheetExportDialog({
	open,
	onClose,
	sections,
	playbookName,
	playbookId,
}: CallSheetExportDialogProps) {
	const { theme } = useTheme()
	const [exporting, setExporting] = useState(false)
	const [selectedSections, setSelectedSections] = useState<Set<string>>(
		new Set(sections.map((s) => s.id))
	)

	if (!open) return null

	const toggleSection = (sectionId: string) => {
		const newSelected = new Set(selectedSections)
		if (newSelected.has(sectionId)) {
			newSelected.delete(sectionId)
		} else {
			newSelected.add(sectionId)
		}
		setSelectedSections(newSelected)
	}

	const handleExportPDF = async () => {
		setExporting(true)

		try {
			// Build sections in order, numbered sequentially across all sections
			let playNumber = 1
			const exportSections = sections
				.filter((s) => selectedSections.has(s.id))
				.map((section) => ({
					name: section.name,
					plays: section.plays.map((play) => ({
						number: playNumber++,
						name: play.name,
					})),
				}))

			const config: CallSheetConfig = {
				title: `${playbookName} - Call Sheet`,
				sections: exportSections,
				columns: ['number', 'name'],
			}

			const response = await fetch('/api/export/callsheet', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playbookId, config }),
			})

			if (!response.ok) {
				throw new Error('Export failed')
			}

			const blob = await response.blob()
			const url = URL.createObjectURL(blob)

			// Trigger download
			const a = document.createElement('a')
			a.href = url
			a.download = `${playbookName.replace(/[^a-z0-9]/gi, '-')}-call-sheet.pdf`
			a.click()

			URL.revokeObjectURL(url)
			onClose()
		} catch (error) {
			console.error('Export error:', error)
			alert('Failed to export call sheet. Please try again.')
		} finally {
			setExporting(false)
		}
	}

	const selectedCount = selectedSections.size
	const totalPlays = sections
		.filter((s) => selectedSections.has(s.id))
		.reduce((sum, s) => sum + s.plays.length, 0)

	return (
		<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
			<div className="rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200 bg-card">
				<h2 className="text-xl font-semibold mb-2 text-card-foreground">
					Export Call Sheet
				</h2>
				<p className="text-sm mb-4 text-muted-foreground">
					Select sections to include in your call sheet. Plays will be numbered
					sequentially.
				</p>

				{/* Sections list */}
				<div className="flex-1 overflow-y-auto mb-4 space-y-2">
					{sections.map((section) => {
						const isSelected = selectedSections.has(section.id)
						return (
							<div
								key={section.id}
								onClick={() => toggleSection(section.id)}
								className={`p-3 rounded-lg cursor-pointer transition-all ${
									isSelected
										? theme === 'dark'
											? 'bg-blue-900/30 border-2 border-blue-500'
											: 'bg-blue-50 border-2 border-blue-500'
										: theme === 'dark'
											? 'bg-gray-700 border-2 border-transparent hover:border-gray-600'
											: 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
								}`}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<input
											type="checkbox"
											checked={isSelected}
											onChange={() => {}}
											className="w-5 h-5 cursor-pointer"
										/>
										<div>
											<div
												className={`font-medium ${
													theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
												}`}
											>
												{section.name}
											</div>
											<div
												className={`text-sm ${
													theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
												}`}
											>
												{section.plays.length} play{section.plays.length !== 1 ? 's' : ''}
											</div>
										</div>
									</div>
								</div>
							</div>
						)
					})}
				</div>

				{/* Summary */}
				<div
					className={`p-3 rounded-lg mb-4 ${
						theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
					}`}
				>
					<div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
						<span className="font-medium">{selectedCount}</span> section
						{selectedCount !== 1 ? 's' : ''} selected • <span className="font-medium">{totalPlays}</span> total play
						{totalPlays !== 1 ? 's' : ''}
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-3 justify-end">
					<button
						onClick={onClose}
						disabled={exporting}
						className={`px-4 py-2 rounded-xl transition-all ${
							exporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
						} ${
							theme === 'dark'
								? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
					>
						Cancel
					</button>
					<button
						onClick={handleExportPDF}
						disabled={exporting || selectedCount === 0}
						className={`px-4 py-2 rounded-xl transition-all ${
							exporting || selectedCount === 0
								? 'opacity-50 cursor-not-allowed'
								: 'cursor-pointer'
						} bg-blue-500 text-white hover:bg-blue-600`}
					>
						{exporting ? 'Generating PDF...' : 'Export PDF'}
					</button>
				</div>
			</div>
		</div>
	)
}
