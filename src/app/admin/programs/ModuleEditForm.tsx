'use client';

import { modules, semesterModules } from '@/db/schema';
import { findModulesByStructure } from '@/server/semester-modules/actions';
import { MultiSelect, Stack, Switch } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SemesterModule = typeof semesterModules.$inferInsert & {
  prerequisiteCodes?: string[];
  module: typeof modules.$inferSelect;
};

type Props = {
  defaultValues?: SemesterModule;
  structureId: number;
  onSubmit: (values: SemesterModule) => Promise<SemesterModule>;
};

export default function ModuleEditForm({
  defaultValues,
  structureId,
  onSubmit,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: modulesList } = useQuery({
    queryKey: ['modules', searchQuery],
    queryFn: () => findModulesByStructure(structureId, searchQuery),
  });

  const prerequisiteOptions = Array.from(
    new Set(modulesList?.map((mod) => mod.module!.code) || []),
  )
    .map((code) => {
      const foundModule = modulesList?.find((m) => m.module!.code === code);
      if (!foundModule) return null;
      return {
        value: code,
        label: `${foundModule.module!.code} - ${foundModule.module!.name}`,
      };
    })
    .filter(Boolean) as { value: string; label: string }[];

  const form = useForm<SemesterModule>({
    initialValues: defaultValues,
  });

  const handleSubmit = async (values: SemesterModule) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      notifications.show({
        title: 'Success',
        message: 'Module updated successfully',
        color: 'green',
      });
      modals.closeAll();
      router.refresh();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to update module',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id='module-edit-form' onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap='md'>
        <Switch
          label='Module Visibility'
          description='Toggle module visibility in the program structure'
          checked={!form.values.hidden}
          onChange={(event) =>
            form.setFieldValue('hidden', !event.currentTarget.checked)
          }
          disabled={isSubmitting}
        />
        <MultiSelect
          label='Prerequisites'
          data={prerequisiteOptions}
          searchable
          onSearchChange={setSearchQuery}
          disabled={isSubmitting}
          {...form.getInputProps('prerequisiteCodes')}
        />
      </Stack>
    </form>
  );
}
