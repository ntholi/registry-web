'use client';

import { lecturers } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type Lecturer = typeof lecturers.$inferInsert;


type Props = {
  onSubmit: (values: Lecturer) => Promise<Lecturer>;
  defaultValues?: Lecturer;
  onSuccess?: (value: Lecturer) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function LecturerForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['lecturers']}
      schema={createInsertSchema(lecturers)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/lecturers/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='User' {...form.getInputProps('user')} />
        </>
      )}
    </Form>
  );
}