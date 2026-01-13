import { useQuery } from '@tanstack/react-query';
import { getActiveTerm } from '@/app/registry/terms';

export function useActiveTerm() {
	const { data, isLoading, isError } = useQuery({
		queryKey: ['active-term'],
		queryFn: () => getActiveTerm(),
		// 20 minutes
		staleTime: 1000 * 60 * 20,
	});

	return {
		activeTerm: data,
		isLoading,
		isError,
	};
}
