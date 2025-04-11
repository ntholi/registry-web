'use client';

import { lecturerModules } from '@/db/schema';
import { Form } from '@/components/adease';
import { Stack, Group, TextInput, Select } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ModuleSearchInput } from '@/components/ModuleSearchInput';

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
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(
    defaultValues?.moduleId || null,
  );

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['lecturerModules']}
      schema={createInsertSchema(lecturerModules)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/lecturer-modules/${id}`);
      }}
    >
      {(form) => (
        <Stack>
          <ModuleSearchInput
            label='Module'
            value={selectedModuleId}
            onChange={(moduleId) => {
              setSelectedModuleId(moduleId);
              if (moduleId) {
                form.setFieldValue('moduleId', moduleId);
              } else {
                form.setFieldValue('moduleId', -1);
                form.setFieldValue('module', '');
              }
            }}
            onModuleSelect={(module) => {
              if (module) {
                form.setFieldValue('module', module.name);
              } else {
                form.setFieldValue('module', '');
              }
            }}
            required
            withAsterisk
          />
        </Stack>
      )}
    </Form>
  );
}
