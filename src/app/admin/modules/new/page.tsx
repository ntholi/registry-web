import { Box } from '@mantine/core';
import Form from '../Form';
import { createModule } from '@/server/modules/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Module'} onSubmit={createModule} />
    </Box>
  );
}