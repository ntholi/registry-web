'use client';

import type { ActionResult } from '@/shared/lib/utils/actionResult';
import { Stack, type StackProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useRouter } from 'nextjs-toploader/app';
import type { JSX, RefObject } from 'react';
import type { ZodObject, ZodTypeAny } from 'zod';
import FormHeader from './FormHeader';

type ZodSchema = ZodObject<Record<string, ZodTypeAny>>;

export type FormProps<T extends Record<string, unknown>, V, R = T> = Omit<
	StackProps,
	'children'
> & {
	children: (
		form: ReturnType<typeof useForm<T>>,
		state: { isSubmitting: boolean },
	) => JSX.Element;
	beforeSubmit?: (form: ReturnType<typeof useForm<T>>) => void;
	action: (values: T) => Promise<R | ActionResult<R>>;
	schema?: ZodSchema;
	defaultValues?: V;
	title?: string;
	onSuccess?: (values: R) => void;
	onError?: (error: Error) => void;
	queryKey: string[];
	formRef?: RefObject<HTMLFormElement | null>;
	hideHeader?: boolean;
};

function isActionResult(value: unknown): value is ActionResult<unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'success' in value &&
		typeof (value as { success: unknown }).success === 'boolean'
	);
}

export function Form<T extends Record<string, unknown>, V, R = T>({
	schema,
	beforeSubmit,
	defaultValues,
	action,
	title,
	children,
	onSuccess,
	onError,
	queryKey,
	formRef,
	hideHeader,
	...props
}: FormProps<T, V, R>) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm<T>({
		validate: schema && zodResolver(schema),
		initialValues: defaultValues as T,
	});

	const mutation = useMutation({
		mutationFn: action,
		onSuccess: async (data) => {
			if (isActionResult(data)) {
				if (!data.success) {
					notifications.show({
						title: 'Error',
						message: data.error,
						color: 'red',
					});
					onError?.({ message: data.error } as Error);
					return;
				}
				await queryClient.invalidateQueries({
					queryKey,
					refetchType: 'all',
				});
				onSuccess?.(data.data as R);
				notifications.show({
					title: 'Success',
					message: 'Record saved successfully',
					color: 'green',
				});
				return;
			}
			await queryClient.invalidateQueries({
				queryKey,
				refetchType: 'all',
			});
			onSuccess?.(data);
			notifications.show({
				title: 'Success',
				message: 'Record saved successfully',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			console.error(error);
			notifications.show({
				title: 'Error',
				message: error.message || 'An unexpected error occurred',
				color: 'red',
			});
			onError?.(error);
		},
	});

	async function handleSubmit(values: T) {
		mutation.mutate(values);
	}

	return (
		<form
			ref={formRef}
			onSubmit={(e) => {
				beforeSubmit?.(form);
				form.onSubmit(handleSubmit)(e);
			}}
		>
			{!hideHeader && (
				<FormHeader
					title={title}
					isLoading={mutation.isPending}
					onClose={() => {
						router.back();
					}}
				/>
			)}
			<Stack p={hideHeader ? undefined : 'xl'} {...props}>
				{children(form, { isSubmitting: mutation.isPending })}
			</Stack>
		</form>
	);
}
