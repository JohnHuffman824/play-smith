import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { useDestinationPlaybooks } from '@/hooks/useDestinationPlaybooks'
import type { Section } from './types'
import './send-to-dialog.css'

interface SendToDialogProps {
	isOpen: boolean
	onClose: () => void
	selectedPlayIds: string[]
	currentPlaybookId: string
	currentPlaybookSections: Section[]
	onComplete: () => void
}

export function SendToDialog({
	isOpen, onClose, selectedPlayIds, currentPlaybookId, currentPlaybookSections, onComplete
}: SendToDialogProps) {
	const [mode, setMode] = useState<'move' | 'copy'>('move')
	const [destinationPlaybookId, setDestinationPlaybookId] = useState<string>(currentPlaybookId)
	const [destinationSectionId, setDestinationSectionId] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const { playbooks, isLoading: playbooksLoading, fetchSections } = useDestinationPlaybooks(currentPlaybookId)

	// Get sections for selected playbook
	const selectedPlaybook = playbooks.find(p => p.id === destinationPlaybookId)
	const availableSections = destinationPlaybookId === currentPlaybookId
		? currentPlaybookSections
		: selectedPlaybook?.sections || []

	// Fetch sections when playbook changes
	useEffect(() => {
		if (destinationPlaybookId && destinationPlaybookId !== currentPlaybookId) {
			fetchSections(destinationPlaybookId)
		}
		setDestinationSectionId('')
	}, [destinationPlaybookId, currentPlaybookId, fetchSections])

	// Reset state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setMode('move')
			setDestinationPlaybookId(currentPlaybookId)
			setDestinationSectionId('')
			setError(null)
		}
	}, [isOpen, currentPlaybookId])

	async function handleSend() {
		if (!destinationSectionId) {
			setError('Please select a destination section')
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			const response = await fetch('/api/plays/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					playIds: selectedPlayIds.map(id => parseInt(id)),
					destinationPlaybookId: parseInt(destinationPlaybookId),
					destinationSectionId: parseInt(destinationSectionId),
					mode,
				}),
			})

			if (!response.ok) {
				let errorMessage = 'Failed to send plays'
				try {
					const data = await response.json()
					errorMessage = data.error || errorMessage
				} catch {
					// Response wasn't JSON, use default message
				}
				throw new Error(errorMessage)
			}

			onComplete()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsSubmitting(false)
		}
	}

	const playCount = selectedPlayIds.length
	const title = `Send ${playCount} play${playCount !== 1 ? 's' : ''} to...`

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="send-to-dialog-content">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<div className="send-to-dialog-body">
					<div className="send-to-field">
						<label className="send-to-label">Action</label>
						<ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as 'move' | 'copy')} variant="outline">
							<ToggleGroupItem value="move">Move</ToggleGroupItem>
							<ToggleGroupItem value="copy">Copy</ToggleGroupItem>
						</ToggleGroup>
						<p className="send-to-hint">
							{mode === 'move' ? 'Plays will be removed from the current location' : 'Plays will be duplicated to the destination'}
						</p>
					</div>

					<div className="send-to-field">
						<label className="send-to-label">Destination Playbook</label>
						<Select value={destinationPlaybookId} onValueChange={setDestinationPlaybookId} disabled={playbooksLoading}>
							<SelectTrigger><SelectValue placeholder="Select playbook..." /></SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Current Playbook</SelectLabel>
									{playbooks.filter(p => p.id === currentPlaybookId).map(pb => (
										<SelectItem key={pb.id} value={pb.id}>{pb.name}</SelectItem>
									))}
								</SelectGroup>
								{playbooks.filter(p => p.id !== currentPlaybookId).length > 0 && (
									<SelectGroup>
										<SelectLabel>Other Playbooks</SelectLabel>
										{playbooks.filter(p => p.id !== currentPlaybookId).map(pb => (
											<SelectItem key={pb.id} value={pb.id}>
												{pb.name}
											</SelectItem>
										))}
									</SelectGroup>
								)}
							</SelectContent>
						</Select>
					</div>

					<div className="send-to-field">
						<label className="send-to-label">Destination Section</label>
						<Select value={destinationSectionId} onValueChange={setDestinationSectionId} disabled={availableSections.length === 0}>
							<SelectTrigger><SelectValue placeholder="Select section..." /></SelectTrigger>
							<SelectContent>
								{availableSections.map(section => (
									<SelectItem key={section.id} value={section.id}>
										{section.name}{section.section_type === 'ideas' && ' (Ideas)'}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{error && <p className="send-to-error">{error}</p>}
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
					<Button variant="action" onClick={handleSend} disabled={isSubmitting || !destinationSectionId}>
						{isSubmitting ? 'Sending...' : mode === 'move' ? 'Move' : 'Copy'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
