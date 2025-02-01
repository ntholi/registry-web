import { Box } from '@mantine/core';
import Form from '../Form';
import { createClearanceTask } from '@/server/clearance-tasks/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Clearance Task'} onSubmit={createClearanceTask} />
    </Box>
  );
}