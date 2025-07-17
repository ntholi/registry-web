import { getModulesForStructure } from '@/server/semester-modules/actions';
import {
  getRegistrationRequest,
  updateRegistrationWithModules,
} from '@/server/registration-requests/actions';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import EditForm from '../../Form';
import { RegistrationRequest } from '../../new/page';
import { StudentModuleStatus, modules, semesterModules } from '@/db/schema';

type Props = {
  params: Promise<{ id: string }>;
};

type Module = typeof modules.$inferSelect;
type SemesterModule = typeof semesterModules.$inferSelect & {
  semesterNumber?: number;
  semesterName?: string;
  module: Module;
};
interface SelectedModule extends SemesterModule {
  status: StudentModuleStatus;
}

export default async function RegistrationRequestEdit({ params }: Props) {
  const { id } = await params;
  const registrationRequest = await getRegistrationRequest(Number(id));
  if (!registrationRequest) {
    return notFound();
  }

  const selectedModules = registrationRequest.requestedModules.map((rm) => ({
    ...rm.semesterModule,
    status: rm.moduleStatus,
  })) as SelectedModule[];

  const structureModules = registrationRequest.structureId
    ? await getModulesForStructure(registrationRequest.structureId)
    : undefined;

  async function handleSubmit(values: RegistrationRequest) {
    'use server';
    const { selectedModules } = values;
    if (!values.id) {
      throw new Error('Registration request ID is required');
    }
    const res = await updateRegistrationWithModules(
      values.id,
      selectedModules?.map((module) => ({
        id: module.id,
        status: module.status,
      })) || [],
      values.semesterNumber,
      values.semesterStatus,
    );
    return { id: values.id, ...res.request };
  }

  return (
    <Box p={'lg'}>
      <EditForm
        title={'Edit Registration Request'}
        defaultValues={{
          id: registrationRequest.id,
          stdNo: registrationRequest.stdNo,
          semesterStatus: registrationRequest.semesterStatus ?? 'Active',
          sponsorId: registrationRequest.sponsorId,
          semesterNumber: registrationRequest.semesterNumber ?? 1,
          selectedModules,
        }}
        onSubmit={handleSubmit}
        structureModules={structureModules}
        structureId={registrationRequest?.structureId || undefined}
      />
    </Box>
  );
}
