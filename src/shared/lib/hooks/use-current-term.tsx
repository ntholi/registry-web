import { useQuery } from '@tanstack/react-query';
import { getCurrentTerm } from '@/server/registry/terms/actions';

export function useCurrentTerm() {
	const { data, isLoading, isError } = useQuery({
		queryKey: ['currentTerm'],
		queryFn: () => getCurrentTerm(),
		// 20 minutes
		staleTime: 1000 * 60 * 20,
	});

	return {
		currentTerm: data,
		isLoading,
		isError,
	};
}
