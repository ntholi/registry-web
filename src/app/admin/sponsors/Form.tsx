'use client';

import { sponsors } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type Sponsor = typeof sponsors.$inferInsert;


type Props = {
  onSubmit: (values: Sponsor) => Promise<Sponsor>;
  defaultValues?: Sponsor;
  onSuccess?: (value: Sponsor) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function SponsorForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['sponsors']}
      schema={createInsertSchema(sponsors)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/sponsors/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Name' {...form.getInputProps('name')} />
        </>
      )}
    </Form>
  );
}