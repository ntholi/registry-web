'use client';

import { users, userRoles } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput, Select } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
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
            data={userRoles.map((role) => ({
              value: role,
              label: role.charAt(0).toUpperCase() + role.slice(1),
            }))}
            {...form.getInputProps('role')}
          />
        </>
      )}
    </Form>
  );
}
