import { Box } from '@mantine/core';
import Form from '../Form';
import { createClearanceResponse } from '@/server/clearance-responses/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Clearance Response'} onSubmit={createClearanceResponse} />
    </Box>
  );
}