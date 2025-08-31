import { Box } from '@mantine/core';
import Form from '../Form';
import { createGraduationRequest } from '@/server/graduation/requests/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form
        title={'Create Graduation Request'}
        onSubmit={createGraduationRequest}
      />
    </Box>
  );
}
