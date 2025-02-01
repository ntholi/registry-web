'use client';

import { clearanceTasks } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type ClearanceResponse = typeof clearanceTasks.$inferInsert;

type Props = {
  onSubmit: (values: ClearanceResponse) => Promise<ClearanceResponse>;
  defaultValues?: ClearanceResponse;
  onSuccess?: (value: ClearanceResponse) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function ClearanceResponseForm({
  onSubmit,
  defaultValues,
  title,
}: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['clearanceResponses']}
      schema={createInsertSchema(clearanceTasks)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/clearance-responses/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput
            label='Clearance Request'
            {...form.getInputProps('clearanceRequest')}
          />
          <TextInput label='Department' {...form.getInputProps('department')} />
          <TextInput label='Cleared By' {...form.getInputProps('clearedBy')} />
        </>
      )}
    </Form>
  );
}
