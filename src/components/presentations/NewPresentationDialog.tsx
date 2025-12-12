import { useState } from 'react'
import { Button } from '../ui/button'
import { Modal } from '../shared/Modal'

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
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium mb-2"
					>
						Name *
					</label>
					<input
						id="name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Enter presentation name"
						className="w-full px-3 py-2 border rounded-lg bg-background"
						disabled={isCreating}
						required
						autoFocus
					/>
				</div>

				<div>
					<label
						htmlFor="description"
						className="block text-sm font-medium mb-2"
					>
						Description
					</label>
					<textarea
						id="description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Enter description (optional)"
						className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
						rows={3}
						disabled={isCreating}
					/>
				</div>

				<div className="flex justify-end gap-2">
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
