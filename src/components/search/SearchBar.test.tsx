import { describe, test, expect, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  afterEach(cleanup)
  test('shows "Select a formation" placeholder initially', () => {
    render(<SearchBar teamId="1" onSelect={() => {}} />)

    const input = screen.getByPlaceholderText('Select a formation...')
    expect(input).toBeDefined()
  })

  test('changes placeholder after formation selected', () => {
    render(
      <SearchBar
        teamId="1"
        onSelect={() => {}}
        selectedFormation={{ id: 1, name: 'Shotgun' }}
      />
    )

    const input = screen.getByPlaceholderText('Add concepts, routes, motions...')
    expect(input).toBeDefined()
  })

  test('displays formation chip when selected', () => {
    render(
      <SearchBar
        teamId="1"
        onSelect={() => {}}
        selectedFormation={{ id: 1, name: 'Shotgun' }}
      />
    )

    expect(screen.getByText('Shotgun')).toBeDefined()
  })

  test('displays concept chips when selected', () => {
    render(
      <SearchBar
        teamId="1"
        onSelect={() => {}}
        selectedFormation={{ id: 1, name: 'Shotgun' }}
        selectedConcepts={[{ id: 1, name: 'Mesh', is_saved: true }]}
      />
    )

    expect(screen.getByText('Mesh')).toBeDefined()
  })

  test('shows asterisk for unsaved compositions', () => {
    render(
      <SearchBar
        teamId="1"
        onSelect={() => {}}
        selectedFormation={{ id: 1, name: 'Shotgun' }}
        selectedConcepts={[{ role: 'X', template_name: 'Slant', is_saved: false }]}
      />
    )

    expect(screen.getByText('X Slant*')).toBeDefined()
  })
})
