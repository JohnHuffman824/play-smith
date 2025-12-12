import { Search } from 'lucide-react'
import { cn } from './utils'

interface SearchInputProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
}

/**
 * Reusable search input component with icon and proper theming.
 */
export function SearchInput({
	value,
	onChange,
	placeholder = 'Search...',
	className,
}: SearchInputProps) {
	return (
		<div className={cn('relative', className)}>
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full pl-11 pr-4 py-2.5 bg-input-background text-foreground placeholder:text-muted-foreground rounded-lg border-2 border-border/50 outline-none focus:ring-2 focus:ring-ring/20 transition-all duration-200"
			/>
		</div>
	)
}
