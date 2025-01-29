import { Box } from '@mantine/core';
import Form from '../Form';
import { createSignup } from '@/server/signups/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Signup'} onSubmit={createSignup} />
    </Box>
  );
}