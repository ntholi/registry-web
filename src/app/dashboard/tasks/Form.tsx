'use client';

import { tasks } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type Task = typeof tasks.$inferInsert;


type Props = {
  onSubmit: (values: Task) => Promise<Task>;
  defaultValues?: Task;
  onSuccess?: (value: Task) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function TaskForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['tasks']}
      schema={createInsertSchema(tasks)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/tasks/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Title' {...form.getInputProps('title')} />
        </>
      )}
    </Form>
  );
}