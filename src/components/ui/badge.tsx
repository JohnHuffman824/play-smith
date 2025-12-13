import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import './badge.css'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

interface BadgeProps extends React.ComponentProps<'span'> {
	variant?: BadgeVariant
	asChild?: boolean
}

function Badge({ className, variant = 'default', asChild = false, ...props }: BadgeProps) {
	const Comp = asChild ? Slot : 'span'

	return (
		<Comp
			data-slot='badge'
			data-variant={variant}
			className={`badge ${className ?? ''}`.trim()}
			{...props}
		/>
	)
}

export { Badge }
export type { BadgeProps, BadgeVariant }
