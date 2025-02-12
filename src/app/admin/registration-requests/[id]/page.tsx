import { DetailsView, DetailsViewHeader } from '@/components/adease';
import {
  deleteRegistrationRequest,
  getRegistrationRequest,
} from '@/server/registration-requests/actions';
import { Stack } from '@mantine/core';
import { notFound } from 'next/navigation';
import RequestDetailsView from './RequestDetailsView';
import ModulesView from './ModulesView';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RegistrationRequestDetails({ params }: Props) {
  const { id } = await params;
  const registrationRequest = await getRegistrationRequest(Number(id));

  if (!registrationRequest) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={`${registrationRequest.student.name}`}
        queryKey={['registrationRequests']}
        handleDelete={async () => {
          'use server';
          await deleteRegistrationRequest(Number(id));
        }}
      />
      <Stack gap='xl' mt='xl' p='sm'>
        <RequestDetailsView value={registrationRequest} />
        <ModulesView value={registrationRequest} />
      </Stack>
    </DetailsView>
  );
}
