'use client';

import { clearanceTasks } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type ClearanceTask = typeof clearanceTasks.$inferInsert;


type Props = {
  onSubmit: (values: ClearanceTask) => Promise<ClearanceTask>;
  defaultValues?: ClearanceTask;
  onSuccess?: (value: ClearanceTask) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function ClearanceTaskForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['clearanceTasks']}
      schema={createInsertSchema(clearanceTasks)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/clearance-tasks/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Clearance Request' {...form.getInputProps('clearanceRequest')} />
          <TextInput label='Department' {...form.getInputProps('department')} />
          <TextInput label='Status' {...form.getInputProps('status')} />
          <TextInput label='Message' {...form.getInputProps('message')} />
          <TextInput label='Cleared By' {...form.getInputProps('clearedBy')} />
        </>
      )}
    </Form>
  );
}