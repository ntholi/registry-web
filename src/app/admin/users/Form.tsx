'use client';

import { Form } from '@/components/adease';
import { userPositions, userRoles, users } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';
import { Select, TextInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

type User = typeof users.$inferInsert;

type Props = {
  onSubmit: (values: Pick<User, 'name' | 'role'>) => Promise<User>;
  defaultValues?: Partial<User>;
  onSuccess?: (value: User) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

export default function UserForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();

  const userFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.enum(userRoles),
  });

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['users']}
      schema={userFormSchema}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/users/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Name' {...form.getInputProps('name')} />
          <Select
            label='Role'
            searchable
            data={userRoles
              .map((role) => ({
                value: role,
                label: toTitleCase(role),
              }))
              .sort((a, b) => a.label.localeCompare(b.label))}
            {...form.getInputProps('role')}
          />
          {form.values.role === 'academic' && (
            <Select
              label='Academic Role'
              data={userPositions.map((role) => ({
                value: role,
                label: toTitleCase(role),
              }))}
              {...form.getInputProps('academicRole')}
            />
          )}
        </>
      )}
    </Form>
  );
}
