import { getModulesForStructure } from '@/server/modules/actions';
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

  const selectedModules = registrationRequest.requestedModules.map((rm) => ({
    ...rm.module,
    status: rm.moduleStatus,
  }));

  const structureModules = registrationRequest.student?.structureId
    ? await getModulesForStructure(registrationRequest.student.structureId)
    : undefined;

  async function handleSubmit(values: RegistrationRequest) {
    'use server';
    const { selectedModules } = values;
    if (!values.id) {
      throw new Error('Registration request ID is required');
    }
    const res = await updateRegistrationWithModules(
      values.id,
      selectedModules?.map((module: SelectedModule) => ({
        id: module.id,
        status: module.status,
      })) || [],
    );
    return { id: values.id, ...res.request };
  }

  return (
    <Box p={'lg'}>
      <EditForm
        title={'Edit Registration Request'}
        defaultValues={{
          ...registrationRequest,
          selectedModules,
        }}
        onSubmit={handleSubmit}
        structureModules={structureModules}
        structureId={registrationRequest.student?.structureId || undefined}
      />
    </Box>
  );
}
