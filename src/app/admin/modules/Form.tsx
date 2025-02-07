'use client';

import { modules, moduleTypeEnum } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput, NumberInput, MultiSelect, Select } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { findAllModules } from '@/server/modules/actions';
import { z } from 'zod';

type Module = typeof modules.$inferInsert;

type Props = {
  onSubmit: (
    values: Module & { prerequisiteCodes?: string[] }
  ) => Promise<Module>;
  defaultValues?: Module & { prerequisiteCodes?: string[] };
  onSuccess?: (value: Module) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function ModuleForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();

  const { data: modulesList } = useQuery({
    queryKey: ['modules'],
    queryFn: () => findAllModules(1, ''),
  });

  const prerequisiteOptions =
    modulesList?.data.map((module) => ({
      value: module.code,
      label: `${module.code} - ${module.name}`,
    })) ?? [];

  const schema = z.object({
    ...createInsertSchema(modules).shape,
    prerequisiteCodes: z.array(z.string()).optional(),
  });

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['modules']}
      schema={schema}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/modules/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Code' {...form.getInputProps('code')} />
          <TextInput label='Name' {...form.getInputProps('name')} />
          <Select
            label='Type'
            data={moduleTypeEnum.map((type) => ({ value: type, label: type }))}
            {...form.getInputProps('type')}
          />
          <NumberInput label='Credits' {...form.getInputProps('credits')} />
          <MultiSelect
            label='Prerequisites'
            placeholder='Select module prerequisites'
            data={prerequisiteOptions}
            searchable
            {...form.getInputProps('prerequisiteCodes')}
          />
        </>
      )}
    </Form>
  );
}
