import React from 'react'
import { FootballField } from './FootballField'

/**
 * Container component that allows the football field
 * to scale dynamically to fill the entire viewport.
 * No scrolling - field extends vertically as needed.
 */
export function FieldContainer() {
	return (
		<div className='w-full h-full overflow-hidden'>
			<FootballField />
		</div>
	)
}
