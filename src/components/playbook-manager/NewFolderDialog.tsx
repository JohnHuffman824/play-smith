import { useState, useEffect } from 'react'
import { Modal } from '../shared/Modal'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useFoldersData } from '../../hooks/useFoldersData'

interface NewFolderDialogProps {
	isOpen: boolean
	onClose: () => void
}

export function NewFolderDialog({ isOpen, onClose }: NewFolderDialogProps) {
	const [folderName, setFolderName] = useState('')
	const [nameError, setNameError] = useState('')
	const [isCreating, setIsCreating] = useState(false)
	const { createFolder } = useFoldersData()

	// Clear input when dialog opens
	useEffect(() => {
		if (isOpen) {
			setFolderName('')
			setNameError('')
			setIsCreating(false)
		}
	}, [isOpen])

	// Validate folder name
	useEffect(() => {
		if (folderName.length === 0) {
			setNameError('')
		} else if (folderName.trim().length === 0) {
			setNameError('Folder name cannot be empty')
		} else if (folderName.trim().length > 255) {
			setNameError('Folder name must be 255 characters or less')
		} else {
			setNameError('')
		}
	}, [folderName])

	async function handleCreate() {
		const trimmedName = folderName.trim()

		// Validate before creating
		if (!trimmedName) {
			setNameError('Folder name is required')
			return
		}
		if (trimmedName.length > 255) {
			setNameError('Folder name must be 255 characters or less')
			return
		}

		setIsCreating(true)
		try {
			await createFolder(trimmedName)
			// Clear input and close on success
			setFolderName('')
			setNameError('')
			onClose()
		} catch (error) {
			console.error('Failed to create folder:', error)
			setNameError('Failed to create folder. Please try again.')
		} finally {
			setIsCreating(false)
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && !isCreating && isFormValid) {
			handleCreate()
		}
	}

	const isFormValid = folderName.trim().length > 0 && folderName.trim().length <= 255 && !nameError

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="New Folder">
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div>
					<label htmlFor="folder-name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>
						Folder Name
					</label>
					<Input
						id="folder-name"
						type="text"
						value={folderName}
						onChange={(e) => setFolderName(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Enter folder name"
						maxLength={255}
						disabled={isCreating}
						className={nameError ? 'border-destructive' : ''}
						aria-invalid={!!nameError}
						autoFocus
					/>
					{nameError && (
						<p style={{ marginTop: '4px', fontSize: '0.875rem', color: 'var(--destructive)' }}>
							{nameError}
						</p>
					)}
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
					<Button
						onClick={onClose}
						variant="outline"
						disabled={isCreating}
					>
						Cancel
					</Button>
					<Button
						onClick={handleCreate}
						disabled={!isFormValid || isCreating}
					>
						{isCreating ? 'Creating...' : 'Create'}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
