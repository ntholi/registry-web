'use client';

import { lecturerModules } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type LecturesModule = typeof lecturerModules.$inferInsert;

type Props = {
  onSubmit: (values: LecturesModule) => Promise<LecturesModule>;
  defaultValues?: LecturesModule;
  onSuccess?: (value: LecturesModule) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

export default function LecturesModuleForm({
  onSubmit,
  defaultValues,
  title,
}: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['lecturerModules ']}
      schema={createInsertSchema(lecturerModules)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/lecturer-modules/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Module' {...form.getInputProps('module')} />
        </>
      )}
    </Form>
  );
}
