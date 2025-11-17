import { useQuery } from '@tanstack/react-query';
import { getConfigDefaults } from '@/config/server-actions';

export default function useConfigDefaults() {
	const { data: defaults, ...rest } = useQuery({
		queryKey: ['config-defaults'],
		queryFn: getConfigDefaults,
		staleTime: Number.POSITIVE_INFINITY,
	});

	return { defaults, ...rest };
}
