'use client';

import { blockedStudents } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type BlockedStudent = typeof blockedStudents.$inferInsert;


type Props = {
  onSubmit: (values: BlockedStudent) => Promise<BlockedStudent>;
  defaultValues?: BlockedStudent;
  onSuccess?: (value: BlockedStudent) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function BlockedStudentForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['blocked-students']}
      schema={createInsertSchema(blockedStudents)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/blocked-students/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Std No' {...form.getInputProps('stdNo')} />
          <TextInput label='Status' {...form.getInputProps('status')} />
          <TextInput label='Reason' {...form.getInputProps('reason')} />
        </>
      )}
    </Form>
  );
}