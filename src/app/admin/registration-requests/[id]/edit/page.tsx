import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getRegistrationRequest, updateRegistrationRequest } from '@/server/registration-requests/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RegistrationRequestEdit({ params }: Props) {
  const { id } = await params;
  const registrationRequest = await getRegistrationRequest(Number(id));
  if (!registrationRequest) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Registration Request'}
        defaultValues={registrationRequest}
        onSubmit={async (value) => {
          'use server';
          return await updateRegistrationRequest(Number(id), value);
        }}
      />
    </Box>
  );
}