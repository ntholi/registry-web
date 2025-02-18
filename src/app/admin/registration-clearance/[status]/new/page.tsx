import { Box } from '@mantine/core';
import Form from '../Form';
import { createRegistrationClearance } from '@/server/registration-clearance/actions';

export default async function NewPage() {
  return (
    <Box p={'lg'}>
      <Form
        title={'Create Clearance Task'}
        onSubmit={createRegistrationClearance}
      />
    </Box>
  );
}
