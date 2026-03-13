'use client';

import { getUserSchools } from '@admin/users';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/core/auth-client';

export function useUserSchools() {
	const { data: session } = authClient.useSession();
	const { data, isLoading, isError } = useQuery({
		queryKey: ['user-schools', session?.user?.id],
		queryFn: () => getUserSchools(session?.user?.id),
		enabled: !!session?.user?.id,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});

	return {
		userSchools: data || [],
		isLoading,
		isError,
	};
}
