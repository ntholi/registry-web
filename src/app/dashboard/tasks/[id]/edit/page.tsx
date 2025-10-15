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

  const taskData = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignedUserIds: task.assignedUsers?.map((u) => u.userId) || [],
    scheduledFor: task.scheduledFor
      ? new Date(task.scheduledFor).toISOString()
      : undefined,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
  };

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Task'}
        defaultValues={taskData}
        onSubmit={async (value) => {
          'use server';
          return await updateTask(id, value);
        }}
      />
    </Box>
  );
}
