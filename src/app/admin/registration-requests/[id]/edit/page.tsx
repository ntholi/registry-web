import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
  getRegistrationRequest,
  updateRegistrationRequest,
} from '@/server/registration-requests/actions';
import EditForm from './EditForm';
import { getCurrentTerm } from '@/server/terms/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RegistrationRequestEdit({ params }: Props) {
  const { id } = await params;
  const term = await getCurrentTerm();
  const registrationRequest = await getRegistrationRequest(Number(id));
  if (!registrationRequest) {
    return notFound();
  }
  if (!term) {
    throw Error('No Current Term');
  }

  return (
    <Box p={'lg'}>
      <EditForm
        title={'Edit Registration Request'}
        defaultValues={registrationRequest}
        term={term.name}
        onSubmit={async (value) => {
          'use server';
          return await updateRegistrationRequest({
            id: Number(id),
            status: value.status,
            message: value.message ?? undefined,
          });
        }}
      />
    </Box>
  );
}
