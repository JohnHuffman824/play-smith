import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Stale time: 5 minutes (formations/concepts don't change often)
			staleTime: 5 * 60 * 1000,
			// Cache time: 10 minutes
			gcTime: 10 * 60 * 1000,
			// Retry failed requests once
			retry: 1,
			// Refetch on window focus for fresh data
			refetchOnWindowFocus: true,
			// Don't refetch on mount if data is fresh
			refetchOnMount: false
		},
		mutations: {
			// Retry failed mutations once
			retry: 1
		}
	}
})

interface QueryProviderProps {
	children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{/* DevTools only in development */}
			{process.env.NODE_ENV === 'development' && (
				<ReactQueryDevtools initialIsOpen={false} />
			)}
		</QueryClientProvider>
	)
}

export { queryClient }
