'use client';

import { clearanceRequests } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type ClearanceRequest = typeof clearanceRequests.$inferInsert;


type Props = {
  onSubmit: (values: ClearanceRequest) => Promise<ClearanceRequest>;
  defaultValues?: ClearanceRequest;
  onSuccess?: (value: ClearanceRequest) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function ClearanceRequestForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['clearanceRequests']}
      schema={createInsertSchema(clearanceRequests)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/clearance-requests/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Std No' {...form.getInputProps('stdNo')} />
          <TextInput label='Term' {...form.getInputProps('term')} />
        </>
      )}
    </Form>
  );
}