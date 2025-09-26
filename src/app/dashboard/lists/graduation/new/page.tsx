import { Box } from '@mantine/core';
import Form from '../Form';
import { createGraduationList } from '@/server/lists/graduation/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Graduation List'} onSubmit={createGraduationList} />
    </Box>
  );
}
