import React from 'react'
import { FootballField } from './FootballField'

/**
 * Container component that allows the football field
 * to scale dynamically to fill available width.
 */
export function FieldContainer() {
	return (
		<div className='w-full h-full overflow-auto'>
			<FootballField />
		</div>
	)
}
