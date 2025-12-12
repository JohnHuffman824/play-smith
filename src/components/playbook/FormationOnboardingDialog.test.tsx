import { describe, test, expect, mock } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { FormationOnboardingDialog } from './FormationOnboardingDialog'

const mockSystemFormations = [
  { name: 'Shotgun', description: 'QB in shotgun', positions: [] },
  { name: 'I-Form', description: 'Traditional I-Formation', positions: [] }
]

const mockTeamFormations = [
  { id: 1, name: 'Custom Spread', description: 'Our spread look' }
]

describe('FormationOnboardingDialog', () => {
  test('shows system default formations', () => {
    render(
      <FormationOnboardingDialog
        isOpen={true}
        systemFormations={mockSystemFormations}
        teamFormations={[]}
        onComplete={() => {}}
        onSkip={() => {}}
      />
    )

    expect(screen.getByText('Shotgun')).toBeDefined()
    expect(screen.getByText('I-Form')).toBeDefined()
  })

  test('shows team formations when available', () => {
    render(
      <FormationOnboardingDialog
        isOpen={true}
        systemFormations={mockSystemFormations}
        teamFormations={mockTeamFormations}
        onComplete={() => {}}
        onSkip={() => {}}
      />
    )

    expect(screen.getByText('Custom Spread')).toBeDefined()
    expect(screen.getByText(/Team Library/)).toBeDefined()
  })

  test('allows selecting multiple formations', () => {
    render(
      <FormationOnboardingDialog
        isOpen={true}
        systemFormations={mockSystemFormations}
        teamFormations={[]}
        onComplete={() => {}}
        onSkip={() => {}}
      />
    )

    const shotgunButton = screen.getByText('Shotgun').closest('button')
    const iFormButton = screen.getByText('I-Form').closest('button')

    fireEvent.click(shotgunButton!)
    fireEvent.click(iFormButton!)

    // Both should have selected state (we can verify by class)
    expect(shotgunButton?.className).toContain('border-blue-500')
    expect(iFormButton?.className).toContain('border-blue-500')
  })

  test('calls onComplete with selected formations', () => {
    const onComplete = mock(() => {})
    render(
      <FormationOnboardingDialog
        isOpen={true}
        systemFormations={mockSystemFormations}
        teamFormations={[]}
        onComplete={onComplete}
        onSkip={() => {}}
      />
    )

    fireEvent.click(screen.getByText('Shotgun').closest('button')!)
    fireEvent.click(screen.getByText(/Import Selected/))

    expect(onComplete).toHaveBeenCalledTimes(1)
    const callArgs = onComplete.mock.calls[0][0]
    expect(callArgs.length).toBe(1)
    expect(callArgs[0].name).toBe('Shotgun')
  })

  test('shows "Create from scratch" option', () => {
    render(
      <FormationOnboardingDialog
        isOpen={true}
        systemFormations={mockSystemFormations}
        teamFormations={[]}
        onComplete={() => {}}
        onSkip={() => {}}
      />
    )

    expect(screen.getByText(/Create from scratch/)).toBeDefined()
  })

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <FormationOnboardingDialog
        isOpen={false}
        systemFormations={mockSystemFormations}
        teamFormations={[]}
        onComplete={() => {}}
        onSkip={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
