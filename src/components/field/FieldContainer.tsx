import React from 'react'
import { FootballField } from './FootballField'

/**
 * Container component that centers the football field
 * and allows responsive horizontal scaling.
 */
export function FieldContainer() {
	return (
		<div className='w-full h-full flex justify-center overflow-hidden'>
			<FootballField />
		</div>
	)
}
