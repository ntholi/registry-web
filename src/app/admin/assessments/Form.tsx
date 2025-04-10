'use client';

import { assessments } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput, NumberInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type Assessment = typeof assessments.$inferInsert;


type Props = {
  onSubmit: (values: Assessment) => Promise<Assessment>;
  defaultValues?: Assessment;
  onSuccess?: (value: Assessment) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function AssessmentForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['assessments']}
      schema={createInsertSchema(assessments)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/assessments/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Assessment Number' {...form.getInputProps('assessmentNumber')} />
          <TextInput label='Assessment Type' {...form.getInputProps('assessmentType')} />
          <NumberInput label='Total Marks' {...form.getInputProps('totalMarks')} />
          <NumberInput label='Weight' {...form.getInputProps('weight')} />
        </>
      )}
    </Form>
  );
}