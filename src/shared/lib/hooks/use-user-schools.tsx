'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getUserSchools } from '@/modules/admin/features/users/server/actions';

export function useUserSchools() {
	const { data: session } = useSession();
	const { data, isLoading, isError } = useQuery({
		queryKey: ['userSchools', session?.user?.id],
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
