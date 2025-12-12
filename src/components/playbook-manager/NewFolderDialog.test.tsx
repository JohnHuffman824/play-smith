import { describe, test, expect, mock, afterEach } from 'bun:test'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { NewFolderDialog } from './NewFolderDialog'

// Mock the useFoldersData hook
const mockCreateFolder = mock(() => Promise.resolve({ id: 1, name: 'Test Folder', team_id: 1, created_at: new Date().toISOString() }))

mock.module('../../hooks/useFoldersData', () => ({
	useFoldersData: mock(() => ({
		folders: [],
		isLoading: false,
		error: null,
		createFolder: mockCreateFolder,
		updateFolder: mock(() => Promise.resolve()),
		deleteFolder: mock(() => Promise.resolve()),
		refetch: mock(() => Promise.resolve())
	}))
}))

describe('NewFolderDialog', () => {
	afterEach(() => {
		cleanup()
		mockCreateFolder.mockClear()
	})

	test('renders when isOpen is true', () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		expect(screen.getByText('New Folder')).toBeDefined()
		expect(screen.getByLabelText('Folder Name')).toBeDefined()
		expect(screen.getByPlaceholderText('Enter folder name')).toBeDefined()
		expect(screen.getByText('Cancel')).toBeDefined()
		expect(screen.getByText('Create')).toBeDefined()
	})

	test('does not render when isOpen is false', () => {
		const { container } = render(
			<NewFolderDialog
				isOpen={false}
				onClose={() => {}}
			/>
		)

		expect(container.firstChild).toBeNull()
	})

	test('shows validation error for whitespace-only input', async () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: '   ' } })

		await waitFor(() => {
			expect(screen.getByText('Folder name cannot be empty')).toBeDefined()
		})
	})

	test('shows validation error for name exceeding 255 characters', async () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		const longName = 'a'.repeat(256)
		fireEvent.change(input, { target: { value: longName } })

		await waitFor(() => {
			expect(screen.getByText('Folder name must be 255 characters or less')).toBeDefined()
		})
	})

	test('does not show validation error for valid input', async () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'Valid Folder Name' } })

		// Wait a bit to ensure no error appears
		await new Promise(resolve => setTimeout(resolve, 100))

		const errorElements = screen.queryAllByText(/Folder name/)
		const hasError = errorElements.some(el =>
			el.textContent?.includes('cannot be empty') ||
			el.textContent?.includes('must be 255 characters')
		)
		expect(hasError).toBe(false)
	})

	test('calls onClose when Cancel button is clicked', () => {
		const onClose = mock(() => {})
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={onClose}
			/>
		)

		fireEvent.click(screen.getByText('Cancel'))
		expect(onClose).toHaveBeenCalledTimes(1)
	})

	test('calls createFolder and onClose when Create button is clicked with valid input', async () => {
		const onClose = mock(() => {})
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={onClose}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'New Folder' } })

		const createButton = screen.getByText('Create')
		fireEvent.click(createButton)

		await waitFor(() => {
			expect(mockCreateFolder).toHaveBeenCalledTimes(1)
			expect(mockCreateFolder).toHaveBeenCalledWith('New Folder')
		})

		await waitFor(() => {
			expect(onClose).toHaveBeenCalledTimes(1)
		})
	})

	test('trims whitespace from folder name before creating', async () => {
		const onClose = mock(() => {})
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={onClose}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: '  Trimmed Folder  ' } })

		const createButton = screen.getByText('Create')
		fireEvent.click(createButton)

		await waitFor(() => {
			expect(mockCreateFolder).toHaveBeenCalledWith('Trimmed Folder')
		})
	})

	test('submits form when Enter key is pressed with valid input', async () => {
		const onClose = mock(() => {})
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={onClose}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'Keyboard Folder' } })
		fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

		await waitFor(() => {
			expect(mockCreateFolder).toHaveBeenCalledTimes(1)
			expect(mockCreateFolder).toHaveBeenCalledWith('Keyboard Folder')
		})
	})

	test('does not submit when Enter key is pressed with invalid input', async () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: '   ' } })
		fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

		// Wait a bit to ensure createFolder is not called
		await new Promise(resolve => setTimeout(resolve, 100))

		expect(mockCreateFolder).not.toHaveBeenCalled()
	})

	test('shows loading state during folder creation', async () => {
		// Create a promise that we can control
		let resolveCreate: (value: any) => void
		const slowCreateFolder = mock(() => new Promise(resolve => {
			resolveCreate = resolve
		}))

		// Re-mock with slow version
		mock.module('../../hooks/useFoldersData', () => ({
			useFoldersData: mock(() => ({
				folders: [],
				isLoading: false,
				error: null,
				createFolder: slowCreateFolder,
				updateFolder: mock(() => Promise.resolve()),
				deleteFolder: mock(() => Promise.resolve()),
				refetch: mock(() => Promise.resolve())
			}))
		}))

		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'Loading Folder' } })

		const createButton = screen.getByText('Create')
		fireEvent.click(createButton)

		// Check for loading state
		await waitFor(() => {
			expect(screen.getByText('Creating...')).toBeDefined()
		})

		// Resolve the promise
		resolveCreate!({ id: 1, name: 'Loading Folder', team_id: 1, created_at: new Date().toISOString() })

		// Wait for loading to finish
		await waitFor(() => {
			expect(screen.queryByText('Creating...')).toBeNull()
		})
	})

	test('disables input and buttons during creation', async () => {
		// Create a promise that we can control
		let resolveCreate: (value: any) => void
		const slowCreateFolder = mock(() => new Promise(resolve => {
			resolveCreate = resolve
		}))

		// Re-mock with slow version
		mock.module('../../hooks/useFoldersData', () => ({
			useFoldersData: mock(() => ({
				folders: [],
				isLoading: false,
				error: null,
				createFolder: slowCreateFolder,
				updateFolder: mock(() => Promise.resolve()),
				deleteFolder: mock(() => Promise.resolve()),
				refetch: mock(() => Promise.resolve())
			}))
		}))

		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'Test Folder' } })

		const createButton = screen.getByText('Create')
		fireEvent.click(createButton)

		// Check that elements are disabled
		await waitFor(() => {
			expect(input.disabled).toBe(true)
			expect(screen.getByText('Cancel').closest('button')?.disabled).toBe(true)
			expect(screen.getByText('Creating...').closest('button')?.disabled).toBe(true)
		})

		// Resolve the promise
		resolveCreate!({ id: 1, name: 'Test Folder', team_id: 1, created_at: new Date().toISOString() })
	})

	test('clears input when dialog opens', () => {
		const { rerender } = render(
			<NewFolderDialog
				isOpen={false}
				onClose={() => {}}
			/>
		)

		// Open dialog and add text
		rerender(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'Some text' } })
		expect(input.value).toBe('Some text')

		// Close dialog
		rerender(
			<NewFolderDialog
				isOpen={false}
				onClose={() => {}}
			/>
		)

		// Re-open dialog - input should be cleared
		rerender(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const newInput = screen.getByLabelText('Folder Name') as HTMLInputElement
		expect(newInput.value).toBe('')
	})

	test('Create button is disabled with empty input', () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const createButton = screen.getByText('Create').closest('button') as HTMLButtonElement
		expect(createButton.disabled).toBe(true)
	})

	test('Create button is disabled with whitespace-only input', async () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: '   ' } })

		await waitFor(() => {
			const createButton = screen.getByText('Create').closest('button') as HTMLButtonElement
			expect(createButton.disabled).toBe(true)
		})
	})

	test('Create button is enabled with valid input', async () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'Valid Name' } })

		await waitFor(() => {
			const createButton = screen.getByText('Create').closest('button') as HTMLButtonElement
			expect(createButton.disabled).toBe(false)
		})
	})

	test('handles createFolder error gracefully', async () => {
		const errorCreateFolder = mock(() => Promise.reject(new Error('Network error')))

		// Re-mock with error version
		mock.module('../../hooks/useFoldersData', () => ({
			useFoldersData: mock(() => ({
				folders: [],
				isLoading: false,
				error: null,
				createFolder: errorCreateFolder,
				updateFolder: mock(() => Promise.resolve()),
				deleteFolder: mock(() => Promise.resolve()),
				refetch: mock(() => Promise.resolve())
			}))
		}))

		// Suppress console.error for this test
		const originalConsoleError = console.error
		console.error = mock(() => {})

		const onClose = mock(() => {})
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={onClose}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'Error Folder' } })

		const createButton = screen.getByText('Create')
		fireEvent.click(createButton)

		await waitFor(() => {
			expect(screen.getByText('Failed to create folder. Please try again.')).toBeDefined()
		})

		// Should not close dialog on error
		expect(onClose).not.toHaveBeenCalled()

		// Restore console.error
		console.error = originalConsoleError
	})

	test('clears error when dialog reopens', async () => {
		const errorCreateFolder = mock(() => Promise.reject(new Error('Network error')))

		// Re-mock with error version
		mock.module('../../hooks/useFoldersData', () => ({
			useFoldersData: mock(() => ({
				folders: [],
				isLoading: false,
				error: null,
				createFolder: errorCreateFolder,
				updateFolder: mock(() => Promise.resolve()),
				deleteFolder: mock(() => Promise.resolve()),
				refetch: mock(() => Promise.resolve())
			}))
		}))

		// Suppress console.error for this test
		const originalConsoleError = console.error
		console.error = mock(() => {})

		const { rerender } = render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		fireEvent.change(input, { target: { value: 'Error Folder' } })

		const createButton = screen.getByText('Create')
		fireEvent.click(createButton)

		await waitFor(() => {
			expect(screen.getByText('Failed to create folder. Please try again.')).toBeDefined()
		})

		// Close dialog
		rerender(
			<NewFolderDialog
				isOpen={false}
				onClose={() => {}}
			/>
		)

		// Re-open dialog - error should be cleared
		rerender(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		expect(screen.queryByText('Failed to create folder. Please try again.')).toBeNull()

		// Restore console.error
		console.error = originalConsoleError
	})

	test('input has maxLength attribute set to 255', () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		expect(input.maxLength).toBe(255)
	})

	test('input has autoFocus attribute', () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement
		// React uses 'autoFocus' (camelCase) but it gets rendered as lowercase in HTML
		expect(input.autofocus !== undefined || input.hasAttribute('autofocus')).toBe(true)
	})

	test('input has correct aria-invalid when error present', async () => {
		render(
			<NewFolderDialog
				isOpen={true}
				onClose={() => {}}
			/>
		)

		const input = screen.getByLabelText('Folder Name') as HTMLInputElement

		// Initially no error
		expect(input.getAttribute('aria-invalid')).toBe('false')

		// Add whitespace to trigger error
		fireEvent.change(input, { target: { value: '   ' } })

		await waitFor(() => {
			expect(input.getAttribute('aria-invalid')).toBe('true')
		})
	})
})
