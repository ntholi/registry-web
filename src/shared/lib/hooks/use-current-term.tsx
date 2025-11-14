import { useQuery } from '@tanstack/react-query';
import { getCurrentTerm } from '@/modules/registry/features/terms/server/actions';

export function useCurrentTerm() {
	const { data, isLoading, isError } = useQuery({
		queryKey: ['current-term'],
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
