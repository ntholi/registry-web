import { Box } from '@mantine/core';
import Form from '../Form';
import { createSponsor } from '@/server/sponsors/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Sponsor'} onSubmit={createSponsor} />
    </Box>
  );
}