'use client';

import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import {
	type ActionResult,
	getActionErrorMessage,
} from '@/shared/lib/utils/actionResult';

export function useActionMutation<TData, TVariables = void>(
	action: (variables: TVariables) => Promise<ActionResult<TData>>,
	options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
	return useMutation<TData, Error, TVariables>({
		mutationFn: async (variables) => {
			const result = await action(variables);
			if (!result.success) {
				throw new Error(getActionErrorMessage(result.error));
			}

			return result.data;
		},
		...options,
	});
}
