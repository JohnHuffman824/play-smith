import { Search } from 'lucide-react'
import { cn } from './utils'
import './search-input.css'

interface SearchInputProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
	style?: React.CSSProperties
}

/**
 * Reusable search input component with icon and proper theming.
 */
export function SearchInput({
	value,
	onChange,
	placeholder = 'Search...',
	className,
	style,
}: SearchInputProps) {
	return (
		<div className={cn('search-input-wrapper', className)} style={style}>
			<Search className="search-input-icon" />
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="search-input"
			/>
		</div>
	)
}
