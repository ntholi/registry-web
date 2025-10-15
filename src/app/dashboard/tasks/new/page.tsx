import { Box } from '@mantine/core';
import Form from '../Form';
import { createTask } from '@/server/tasks/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Task'} onSubmit={createTask} />
    </Box>
  );
}