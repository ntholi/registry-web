import { Box } from '@mantine/core';
import Form from '../Form';
import { createClearanceRequest } from '@/server/clearance-requests/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Clearance Request'} onSubmit={createClearanceRequest} />
    </Box>
  );
}