import { Box } from '@mantine/core';
import Form from '../Form';
import { createLecturer } from '@/server/lecturers/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Lecturer'} onSubmit={createLecturer} />
    </Box>
  );
}