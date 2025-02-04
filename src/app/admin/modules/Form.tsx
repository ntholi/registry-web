'use client';

import { modules } from '@/db/schema';
import { Form } from '@/components/adease';
import { TextInput, NumberInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';

type Module = typeof modules.$inferInsert;


type Props = {
  onSubmit: (values: Module) => Promise<Module>;
  defaultValues?: Module;
  onSuccess?: (value: Module) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
};

export default function ModuleForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  
  return (
    <Form 
      title={title}
      action={onSubmit} 
      queryKey={['modules']}
      schema={createInsertSchema(modules)} 
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/admin/modules/${id}`);
      }}
    >
      {(form) => (
        <>
          <TextInput label='Code' {...form.getInputProps('code')} />
          <TextInput label='Name' {...form.getInputProps('name')} />
          <TextInput label='Type' {...form.getInputProps('type')} />
          <NumberInput label='Credis' {...form.getInputProps('credis')} />
        </>
      )}
    </Form>
  );
}