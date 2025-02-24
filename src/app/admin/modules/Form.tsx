'use client';

import { Form } from '@/components/adease';
import { modules, moduleTypeEnum } from '@/db/schema';
import { findAllModules } from '@/server/modules/actions';
import { MultiSelect, NumberInput, Select, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

type Module = typeof modules.$inferInsert;

type Props = {
  onSubmit: (
    values: Module & { prerequisiteCodes?: string[] },
  ) => Promise<Module>;
  defaultValues?: Module & { prerequisiteCodes?: string[] };
  onSuccess?: (value: Module) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

export default function ModuleForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  const { data: modulesList } = useQuery({
    queryKey: ['modules', debouncedSearch],
    queryFn: () => findAllModules(1, debouncedSearch),
  });

  const prerequisiteOptions = Array.from(
    new Set(modulesList?.data.map((mod) => mod.code)),
  )
    .map((code) => {
      const foundModule = modulesList?.data.find((m) => m.code === code);
      if (!foundModule) return null;
      return {
        value: code,
        label: `${foundModule.code} - ${foundModule.name}`,
      };
    })
    .filter(Boolean) as { value: string; label: string }[];

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
          <NumberInput label='ID' {...form.getInputProps('id')} />
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
            onSearchChange={setSearchQuery}
            {...form.getInputProps('prerequisiteCodes')}
          />
        </>
      )}
    </Form>
  );
}
