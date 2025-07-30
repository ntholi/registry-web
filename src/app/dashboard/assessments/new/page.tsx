import { Box } from '@mantine/core';
import Form from '../Form';
import { createAssessment } from '@/server/assessments/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form title={'Create Assessment'} onSubmit={createAssessment} />
    </Box>
  );
}