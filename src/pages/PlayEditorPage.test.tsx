import { describe, test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { PlayEditorPage } from './PlayEditorPage'

describe('PlayEditorPage', () => {
	test('renders play editor with toolbar', () => {
		render(
			<ThemeProvider>
				<MemoryRouter>
					<PlayEditorPage />
				</MemoryRouter>
			</ThemeProvider>
		)

		// Should render the play editor UI
		// Note: This is a basic test - existing canvas tests cover detailed functionality
		expect(screen.getByRole('main')).toBeDefined()
	})
})
