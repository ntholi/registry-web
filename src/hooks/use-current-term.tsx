import { useQuery } from '@tanstack/react-query';
import { getCurrentTerm } from '@/server/terms/actions';

export function useCurrentTerm() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['currentTerm'],
    queryFn: () => getCurrentTerm(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    currentTerm: data,
    isLoading,
    isError,
  };
}
