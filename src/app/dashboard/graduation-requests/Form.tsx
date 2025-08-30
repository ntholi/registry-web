'use client';

import { graduationRequests } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type GraduationRequest = typeof graduationRequests.$inferInsert;

type Props = {
  onSubmit: (values: GraduationRequest) => Promise<GraduationRequest>;
  defaultValues?: GraduationRequest;
  onSuccess?: (value: GraduationRequest) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function GraduationRequestForm({
  onSubmit,
  defaultValues,
  title,
}: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['graduation-clearances']}
      schema={createInsertSchema(graduationRequests)}
      defaultValues={defaultValues}
      onSuccess={() => {
        router.push(`/dashboard/graduation-requests/pending`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Std No' {...form.getInputProps('stdNo')} />
        </>
      )}
    </Form>
  );
}
