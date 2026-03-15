import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { getActiveTerm, getAllTerms } from '@/app/registry/terms';
import { type ActionData, unwrap } from '@/shared/lib/utils/actionResult';

type ActiveTermQueryData = Awaited<ReturnType<typeof getActiveTerm>>;
type TermsQueryData = Awaited<ReturnType<typeof getAllTerms>>;
type ActiveTerm = ActionData<typeof getActiveTerm>;
type Terms = ActionData<typeof getAllTerms>;

type ActiveTermOptions = Omit<
	UseQueryOptions<ActiveTermQueryData, Error, ActiveTerm>,
	'queryKey' | 'queryFn' | 'select'
>;

type AllTermsOptions = Omit<
	UseQueryOptions<TermsQueryData, Error, Terms>,
	'queryKey' | 'queryFn' | 'select'
>;

export function useActiveTerm(options?: ActiveTermOptions) {
	const query = useQuery({
		queryKey: ['active-term'],
		queryFn: getActiveTerm,
		select: unwrap,
		...options,
		staleTime: options?.staleTime ?? 1000 * 60 * 20,
	});

	return {
		...query,
		activeTerm: query.data,
	};
}

export function useAllTerms(options?: AllTermsOptions) {
	return useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
		select: unwrap,
		...options,
		staleTime: options?.staleTime ?? 1000 * 60 * 10,
	});
}
