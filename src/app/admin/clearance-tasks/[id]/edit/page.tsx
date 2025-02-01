import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getClearanceTask, updateClearanceTask } from '@/server/clearance-tasks/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceTaskEdit({ params }: Props) {
  const { id } = await params;
  const clearanceTask = await getClearanceTask(Number(id));
  if (!clearanceTask) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Clearance Task'}
        defaultValues={clearanceTask}
        onSubmit={async (value) => {
          'use server';
          return await updateClearanceTask(Number(id), value);
        }}
      />
    </Box>
  );
}