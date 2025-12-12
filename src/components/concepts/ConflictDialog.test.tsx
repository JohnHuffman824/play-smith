import { describe, test, expect, mock, afterEach } from 'bun:test'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ConflictDialog } from './ConflictDialog'

describe('ConflictDialog', () => {
  afterEach(cleanup)
  test('shows existing assignment and new assignment', () => {
    render(
      <ConflictDialog
        isOpen={true}
        playerRole="X"
        existingConcept="Slant"
        newConcept="Post"
        onReplace={() => {}}
        onCancel={() => {}}
      />
    )

    // Check for the role and existing concept
    expect(screen.getByText('Slant')).toBeDefined()
    expect(screen.getByText('Post')).toBeDefined()
    expect(screen.getByText(/already has/)).toBeDefined()
    expect(screen.getByText(/Replace with/)).toBeDefined()
  })

  test('calls onReplace when Replace clicked', () => {
    const onReplace = mock(() => {})
    render(
      <ConflictDialog
        isOpen={true}
        playerRole="X"
        existingConcept="Slant"
        newConcept="Post"
        onReplace={onReplace}
        onCancel={() => {}}
      />
    )

    fireEvent.click(screen.getByText('Replace'))
    expect(onReplace).toHaveBeenCalled()
  })

  test('calls onCancel when Cancel clicked', () => {
    const onCancel = mock(() => {})
    render(
      <ConflictDialog
        isOpen={true}
        playerRole="X"
        existingConcept="Slant"
        newConcept="Post"
        onReplace={() => {}}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <ConflictDialog
        isOpen={false}
        playerRole="X"
        existingConcept="Slant"
        newConcept="Post"
        onReplace={() => {}}
        onCancel={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
