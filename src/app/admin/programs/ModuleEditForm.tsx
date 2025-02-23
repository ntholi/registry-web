'use client';

import { modules, moduleTypeEnum } from '@/db/schema';
import { NumberInput, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useRouter } from 'next/navigation';

type Module = typeof modules.$inferInsert;

type Props = {
  defaultValues?: Module;
  onSubmit: (values: Module) => Promise<Module>;
};

export default function ModuleEditForm({ defaultValues, onSubmit }: Props) {
  const router = useRouter();
  
  const form = useForm<Module>({
    initialValues: defaultValues || {
      id: 0,
      code: '',
      name: '',
      type: 'Core',
      credits: 0,
    },
    validate: {
      code: (value) => (!value ? 'Code is required' : null),
      name: (value) => (!value ? 'Name is required' : null),
      credits: (value) => (value <= 0 ? 'Credits must be greater than 0' : null),
    },
  });

  const handleSubmit = async (values: Module) => {
    try {
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
        message: error instanceof Error ? error.message : 'Failed to update module',
        color: 'red',
      });
    }
  };

  return (
    <form id="module-edit-form" onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Code"
          placeholder="Enter module code"
          required
          {...form.getInputProps('code')}
        />
        <TextInput
          label="Name"
          placeholder="Enter module name"
          required
          {...form.getInputProps('name')}
        />
        <Select
          label="Type"
          data={moduleTypeEnum.map((type) => ({ value: type, label: type }))}
          required
          {...form.getInputProps('type')}
        />
        <NumberInput
          label="Credits"
          placeholder="Enter credits"
          required
          min={0}
          max={100}
          {...form.getInputProps('credits')}
        />
      </Stack>
    </form>
  );
}