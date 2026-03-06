import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { getActiveTerm, getAllTerms } from '@/app/registry/terms';

type ActiveTerm = Awaited<ReturnType<typeof getActiveTerm>>;
type Terms = Awaited<ReturnType<typeof getAllTerms>>;

type ActiveTermOptions = Omit<
	UseQueryOptions<ActiveTerm, Error>,
	'queryKey' | 'queryFn'
>;

type AllTermsOptions<TData = Terms> = Omit<
	UseQueryOptions<Terms, Error, TData>,
	'queryKey' | 'queryFn'
>;

export function useActiveTerm(options?: ActiveTermOptions) {
	const query = useQuery({
		queryKey: ['active-term'],
		queryFn: getActiveTerm,
		...options,
		staleTime: options?.staleTime ?? 1000 * 60 * 20,
	});

	return {
		...query,
		activeTerm: query.data,
	};
}

export function useAllTerms<TData = Terms>(options?: AllTermsOptions<TData>) {
	return useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
		...options,
		staleTime: options?.staleTime ?? 1000 * 60 * 10,
	});
}
