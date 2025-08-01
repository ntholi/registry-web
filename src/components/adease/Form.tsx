'use client';

import { ZodObject, ZodTypeAny } from 'zod';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Stack, StackProps } from '@mantine/core';
import React, { JSX } from 'react';
import FormHeader from './FormHeader';
import { useRouter } from 'nextjs-toploader/app';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';

type ZodSchema = ZodObject<Record<string, ZodTypeAny>>;

export type FormProps<T extends Record<string, unknown>, V> = Omit<
  StackProps,
  'children'
> & {
  children: (form: ReturnType<typeof useForm<T>>) => JSX.Element;
  beforeSubmit?: (form: ReturnType<typeof useForm<T>>) => void;
  action: (values: T) => Promise<T>;
  schema?: ZodSchema;
  defaultValues?: V;
  title?: string;
  onSuccess?: (values: T) => void;
  onError?: (error: Error) => void;
  queryKey: string[];
};

export function Form<T extends Record<string, unknown>, V>({
  schema,
  beforeSubmit,
  defaultValues,
  action,
  title,
  children,
  onSuccess,
  onError,
  queryKey,
  ...props
}: FormProps<T, V>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<T>({
    validate: schema && zodResolver(schema),
    initialValues: defaultValues as T,
  });

  const mutation = useMutation({
    mutationFn: action,
    onSuccess: async (data) => {
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
      onSubmit={(e) => {
        beforeSubmit?.(form);
        form.onSubmit(handleSubmit)(e);
      }}
    >
      <FormHeader
        title={title}
        isLoading={mutation.isPending}
        onClose={() => {
          router.back();
        }}
      />
      <Stack p='xl' {...props}>
        {children(form)}
      </Stack>
    </form>
  );
}
