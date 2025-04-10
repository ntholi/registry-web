import { Box } from '@mantine/core';
import Form from '../Form';
import { createLecturesModule } from '@/server/lecturer-modules/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Lectures Module'} onSubmit={createLecturesModule} />
    </Box>
  );
}
