import {
  getRegistrationRequest,
  updateRegistrationWithModules,
} from '@/server/registration-requests/actions';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import EditForm from '../../Form';
import { RegistrationRequest, SelectedModule } from '../../new/page';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RegistrationRequestEdit({ params }: Props) {
  const { id } = await params;
  const registrationRequest = await getRegistrationRequest(Number(id));
  if (!registrationRequest) {
    return notFound();
  }
  async function handleSubmit(values: RegistrationRequest) {
    'use server';
    const { selectedModules } = values;
    const res = await updateRegistrationWithModules(
      Number(id),
      selectedModules?.map((module: SelectedModule) => ({
        id: module.id,
        status: module.status,
      })) || [],
    );
    return res.request;
  }

  return (
    <Box p={'lg'}>
      <EditForm
        title={'Edit Registration Request'}
        defaultValues={registrationRequest}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
