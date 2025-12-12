import { useState } from 'react'
import { useTheme } from '@/contexts/SettingsContext'
import type { Section } from '../../hooks/usePlaybookData'
import type { CallSheetConfig } from '../../types/export.types'
import './call-sheet-export-dialog.css'

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
		<div className="call-sheet-export">
			<div className="call-sheet-export__dialog">
				<h2 className="call-sheet-export__title">
					Export Call Sheet
				</h2>
				<p className="call-sheet-export__description">
					Select sections to include in your call sheet. Plays will be numbered
					sequentially.
				</p>

				{/* Sections list */}
				<div className="call-sheet-export__list">
					{sections.map((section) => {
						const isSelected = selectedSections.has(section.id)
						return (
							<div
								key={section.id}
								onClick={() => toggleSection(section.id)}
								className={`call-sheet-export__section ${
									isSelected
										? 'call-sheet-export__section--selected'
										: 'call-sheet-export__section--unselected'
								}`}
							>
								<div className="call-sheet-export__section-content">
									<div className="call-sheet-export__section-left">
										<input
											type="checkbox"
											checked={isSelected}
											onChange={() => {}}
											className="call-sheet-export__checkbox"
											aria-label={`Select ${section.name}`}
										/>
										<div>
											<div className="call-sheet-export__section-name">
												{section.name}
											</div>
											<div className="call-sheet-export__section-count">
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
				<div className="call-sheet-export__summary">
					<div className="call-sheet-export__summary-text">
						<span className="call-sheet-export__summary-number">{selectedCount}</span> section
						{selectedCount !== 1 ? 's' : ''} selected • <span className="call-sheet-export__summary-number">{totalPlays}</span> total play
						{totalPlays !== 1 ? 's' : ''}
					</div>
				</div>

				{/* Actions */}
				<div className="call-sheet-export__actions">
					<button
						onClick={onClose}
						disabled={exporting}
						className="call-sheet-export__button call-sheet-export__button--cancel"
					>
						Cancel
					</button>
					<button
						onClick={handleExportPDF}
						disabled={exporting || selectedCount === 0}
						className="call-sheet-export__button call-sheet-export__button--export"
					>
						{exporting ? 'Generating PDF...' : 'Export PDF'}
					</button>
				</div>
			</div>
		</div>
	)
}
