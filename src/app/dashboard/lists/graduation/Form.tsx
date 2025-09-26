'use client';

import { graduationLists } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type GraduationList = typeof graduationLists.$inferInsert;

type Props = {
  onSubmit: (values: GraduationList) => Promise<GraduationList>;
  defaultValues?: GraduationList;
  onSuccess?: (value: GraduationList) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function GraduationListForm({
  onSubmit,
  defaultValues,
  title,
}: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['graduation-lists']}
      schema={createInsertSchema(graduationLists)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/lists/graduation/${id}`);
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
