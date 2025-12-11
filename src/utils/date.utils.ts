/**
 * Format a date as "Day Month Year" (e.g., "10 December 2025")
 */
export function formatDateDayMonthYear(dateString: string): string {
	if (!dateString) return ''
	const date = new Date(dateString)
	if (isNaN(date.getTime())) return dateString
	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}
