import { useState } from 'react'
import { Button } from '../ui/button'
import { Modal } from '../shared/Modal'
import './new-presentation-dialog.css'

type NewPresentationDialogProps = {
	isOpen: boolean
	onClose: () => void
	onCreate: (name: string, description?: string) => Promise<void>
}

export function NewPresentationDialog({
	isOpen,
	onClose,
	onCreate,
}: NewPresentationDialogProps) {
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [isCreating, setIsCreating] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) return

		setIsCreating(true)
		try {
			await onCreate(name.trim(), description.trim() || undefined)
			setName('')
			setDescription('')
			onClose()
		} catch (error) {
			console.error('Failed to create presentation:', error)
		} finally {
			setIsCreating(false)
		}
	}

	const handleClose = () => {
		if (!isCreating) {
			setName('')
			setDescription('')
			onClose()
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="New Presentation"
		>
			<form onSubmit={handleSubmit} className="new-presentation-dialog__form">
				<div className="new-presentation-dialog__field">
					<label
						htmlFor="name"
						className="new-presentation-dialog__label"
					>
						Name *
					</label>
					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Enter presentation name"
						className="new-presentation-dialog__input"
						disabled={isCreating}
						required
						autoFocus
					/>
				</div>

				<div className="new-presentation-dialog__field">
					<label
						htmlFor="description"
						className="new-presentation-dialog__label"
					>
						Description
					</label>
					<textarea
						id="description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Enter description (optional)"
						className="new-presentation-dialog__textarea"
						rows={3}
						disabled={isCreating}
					/>
				</div>

				<div className="new-presentation-dialog__actions">
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isCreating}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={!name.trim() || isCreating}
					>
						{isCreating ? 'Creating...' : 'Create'}
					</Button>
				</div>
			</form>
		</Modal>
	)
}
