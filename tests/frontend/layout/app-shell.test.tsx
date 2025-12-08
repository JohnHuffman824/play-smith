import { test, expect } from 'bun:test'
import React from 'react'
import { render } from '@testing-library/react'
import { AppShell } from '../../../src/components/layout/AppShell'

test('AppShell shows sidebar and whiteboard', () => {
	const { getByTestId } = render(<AppShell />)

	expect(getByTestId('playsmith-sidebar')).toBeTruthy()
	expect(getByTestId('playsmith-whiteboard')).toBeTruthy()
})

