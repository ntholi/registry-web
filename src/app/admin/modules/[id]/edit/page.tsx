import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getModule, updateModule } from '@/server/modules/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModuleEdit({ params }: Props) {
  const { id } = await params;
  const item = await getModule(Number(id));
  if (!item) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Module'}
        defaultValues={item}
        onSubmit={async (value) => {
          'use server';
          return await updateModule(Number(id), value);
        }}
      />
    </Box>
  );
}
