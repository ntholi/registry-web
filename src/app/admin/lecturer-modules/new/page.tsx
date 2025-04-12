import { Box } from '@mantine/core';
import Form from '../Form';
import { createLecturesModule } from '@/server/lecturer-modules/actions';

export default async function NewPage() {
  const handleSubmit = async (values: { moduleId: number; id?: number }) => {
    'use server';
    const result = await createLecturesModule(values);
    return { moduleId: result.semesterModuleId, id: result.id };
  };

  return (
    <Box p={'lg'}>
      <Form title={'Assign Module'} onSubmit={handleSubmit} />
    </Box>
  );
}
