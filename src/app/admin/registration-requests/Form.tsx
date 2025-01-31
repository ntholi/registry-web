'use client';

import { registrationRequests } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type RegistrationRequest = typeof registrationRequests.$inferInsert;


type Props = {
  onSubmit: (values: RegistrationRequest) => Promise<RegistrationRequest>;
  defaultValues?: RegistrationRequest;
  onSuccess?: (value: RegistrationRequest) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function RegistrationRequestForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['registrationRequests']}
      schema={createInsertSchema(registrationRequests)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/registration-requests/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Std No' {...form.getInputProps('stdNo')} />
          <TextInput label='Term' {...form.getInputProps('term')} />
          <TextInput label='Status' {...form.getInputProps('status')} />
          <TextInput label='Message' {...form.getInputProps('message')} />
        </>
      )}
    </Form>
  );
}