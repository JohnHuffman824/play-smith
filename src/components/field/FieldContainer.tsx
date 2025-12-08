import React from 'react'
import { FootballField } from './FootballField'

/**
 * Container component that centers and scales the football field
 * within the whiteboard area.
 */
export function FieldContainer() {
	return (
		<div className='w-full h-full flex items-center justify-center p-4'>
			<div className='w-full h-full max-w-full max-h-full'>
				<FootballField />
			</div>
		</div>
	)
}

