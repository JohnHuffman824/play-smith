import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const TEN_MINUTES_MS = 10 * 60 * 1000
const SINGLE_RETRY = 1

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Stale time: 5 minutes (formations/concepts don't change often)
			staleTime: FIVE_MINUTES_MS,
			// Cache time: 10 minutes
			gcTime: TEN_MINUTES_MS,
			// Retry failed requests once
			retry: SINGLE_RETRY,
			// Refetch on window focus for fresh data
			refetchOnWindowFocus: true,
			// Don't refetch on mount if data is fresh
			refetchOnMount: false
		},
		mutations: {
			// Retry failed mutations once
			retry: SINGLE_RETRY
		}
	}
})

type QueryProviderProps = {
	children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	)
}

export { queryClient }
