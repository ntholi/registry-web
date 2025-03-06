import { Box } from '@mantine/core';
import Form from '../Form';
import { createRegistrationRequest } from '@/server/registration-requests/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form
        title={'Create Registration Request'}
        onSubmit={createRegistrationRequest}
      />
    </Box>
  );
}
