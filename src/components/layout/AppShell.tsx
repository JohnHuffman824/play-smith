import React from 'react'
import { Sidebar } from './Sidebar'
import { FieldContainer } from '../field/FieldContainer'

export function AppShell() {
	return (
		<div className='flex h-screen bg-[#f2f2f2]'>
			<aside
				className='w-64 border-r bg-white/90'
				data-testid='playsmith-sidebar'
			>
				<Sidebar />
			</aside>
			<main
				className='flex-1 relative overflow-hidden'
				data-testid='playsmith-whiteboard'
			>
				<FieldContainer />
			</main>
		</div>
	)
}

