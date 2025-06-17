'use client';

import { registrationClearances } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';

type RegistrationClearance = typeof registrationClearances.$inferInsert;

type Props = {
  onSubmit: (values: RegistrationClearance) => Promise<RegistrationClearance>;
  status: 'pending' | 'approved' | 'rejected';
  defaultValues?: RegistrationClearance;
  onSuccess?: (value: RegistrationClearance) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

export default function RegistrationClearanceForm({
  onSubmit,
  status,
  defaultValues,
  title,
}: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['registrationClearances']}
      schema={createInsertSchema(registrationClearances)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/registration-clearance/${status}/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Department' {...form.getInputProps('department')} />
          <TextInput label='Status' {...form.getInputProps('status')} />
          <TextInput label='Message' {...form.getInputProps('message')} />
          <TextInput
            label='Responded By'
            {...form.getInputProps('respondedBy')}
          />
        </>
      )}
    </Form>
  );
}
