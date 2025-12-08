import React from 'react'
import { FootballField } from './FootballField'

/**
 * Container component that centers the football field
 * and allows responsive horizontal scaling.
 */
export function FieldContainer() {
	return (
		<div className='w-full h-full flex items-center justify-center p-4 overflow-hidden'>
			<div className='w-full max-w-full max-h-full aspect-[4/9]'>
				<FootballField />
			</div>
		</div>
	)
}
