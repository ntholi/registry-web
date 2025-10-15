import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getTask, updateTask } from '@/server/tasks/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TaskEdit({ params }: Props) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Task'}
        defaultValues={task}
        onSubmit={async (value) => {
          'use server';
          return await updateTask(id, value);
        }}
      />
    </Box>
  );
}