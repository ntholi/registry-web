'use client';

import { Form } from '@/components/adease';
import { ModuleSearchInput } from '@/components/ModuleSearchInput';
import { Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

const lecturesModule = z.object({
  id: z.number().optional(),
  moduleId: z.number(),
});
type LecturesModule = z.infer<typeof lecturesModule>;

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
      schema={lecturesModule}
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
