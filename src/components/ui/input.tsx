import * as React from 'react'

import './input.css'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot='input'
			className={`input ${className ?? ''}`.trim()}
			{...props}
		/>
	)
}

export { Input }
