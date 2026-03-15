'use client';

import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import {
	type ActionResult,
	getActionErrorMessage,
} from '@/shared/lib/utils/actionResult';

type ActionMutationOptions<TData, TVariables, TContext> = Omit<
	UseMutationOptions<TData, Error, TVariables, TContext>,
	'mutationFn'
> & {
	mutationFn: (variables: TVariables) => Promise<ActionResult<TData>>;
};

export function useActionMutation<TData, TVariables = void, TContext = unknown>(
	options: ActionMutationOptions<TData, TVariables, TContext>
): ReturnType<typeof useMutation<TData, Error, TVariables, TContext>>;

export function useActionMutation<TData, TVariables = void, TContext = unknown>(
	action: (variables: TVariables) => Promise<ActionResult<TData>>,
	options?: Omit<
		UseMutationOptions<TData, Error, TVariables, TContext>,
		'mutationFn'
	>
): ReturnType<typeof useMutation<TData, Error, TVariables, TContext>>;

export function useActionMutation<TData, TVariables = void, TContext = unknown>(
	actionOrOptions:
		| ((variables: TVariables) => Promise<ActionResult<TData>>)
		| ActionMutationOptions<TData, TVariables, TContext>,
	options?: Omit<
		UseMutationOptions<TData, Error, TVariables, TContext>,
		'mutationFn'
	>
) {
	let mutationFn: (variables: TVariables) => Promise<ActionResult<TData>>;
	let config:
		| Omit<UseMutationOptions<TData, Error, TVariables, TContext>, 'mutationFn'>
		| undefined;

	if (typeof actionOrOptions === 'function') {
		mutationFn = actionOrOptions;
		config = options;
	} else {
		const { mutationFn: nextMutationFn, ...nextConfig } = actionOrOptions;
		mutationFn = nextMutationFn;
		config = nextConfig;
	}

	return useMutation<TData, Error, TVariables, TContext>({
		mutationFn: async (variables) => {
			const result = await mutationFn(variables);
			if (!result.success) {
				throw new Error(getActionErrorMessage(result.error));
			}

			return result.data;
		},
		...config,
	});
}
