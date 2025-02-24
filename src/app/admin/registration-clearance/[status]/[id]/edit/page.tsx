import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import {
  getRegistrationClearance,
  updateRegistrationClearance,
} from '@/server/registration-clearance/actions';

type Props = {
  params: Promise<{ id: string; status: string }>;
};

export default async function RegistrationClearanceEdit({ params }: Props) {
  const { id, status } = await params;
  const registrationClearance = await getRegistrationClearance(Number(id));
  if (!registrationClearance) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Clearance Task'}
        status={status as 'pending' | 'approved' | 'rejected'}
        defaultValues={registrationClearance}
        onSubmit={async (value) => {
          'use server';
          return await updateRegistrationClearance(Number(id), value);
        }}
      />
    </Box>
  );
}
