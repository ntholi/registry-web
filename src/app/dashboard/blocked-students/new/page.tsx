import { Box } from '@mantine/core';
import Form from '../Form';
import { createBlockedStudent } from '@/server/blocked-students/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Blocked Student'} onSubmit={createBlockedStudent} />
    </Box>
  );
}