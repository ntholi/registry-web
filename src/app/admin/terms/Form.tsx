'use client';

import { Form } from '@/components/adease';
import { terms } from '@/db/schema';
import { NumberInput, Switch, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';

type Term = typeof terms.$inferInsert;

type Props = {
  onSubmit: (values: Term) => Promise<Term>;
  defaultValues?: Term;
  onSuccess?: (value: Term) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

export default function TermForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['terms']}
      schema={createInsertSchema(terms)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/terms/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Name' {...form.getInputProps('name')} />
          <NumberInput
            min={1}
            max={2}
            label='Semester'
            description='Semester 1 or Semester 2'
            {...form.getInputProps('semester')}
          />
          <Switch
            label='Set as Active Term'
            {...form.getInputProps('isActive', { type: 'checkbox' })}
          />
        </>
      )}
    </Form>
  );
}
