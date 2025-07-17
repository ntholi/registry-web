import { semesterModules, StudentModuleStatus } from '@/db/schema';
import { createRegistrationWithModules } from '@/server/registration-requests/actions';
import { Box } from '@mantine/core';
import Form from '../Form';

type Module = typeof semesterModules.$inferSelect;
export interface SelectedModule extends Module {
  status: StudentModuleStatus;
}

export type RegistrationRequest = {
  id?: number;
  stdNo: number;
  semesterStatus: 'Active' | 'Repeat';
  sponsorId: number;
  borrowerNo?: string;
  semesterNumber: number;
  selectedModules?: Array<SelectedModule>;
};

export default async function NewPage() {
  async function handleSubmit(values: RegistrationRequest) {
    'use server';
    const {
      stdNo,
      semesterStatus,
      sponsorId,
      borrowerNo,
      semesterNumber,
      selectedModules,
    } = values;
    const res = await createRegistrationWithModules({
      stdNo: stdNo,
      semesterNumber,
      semesterStatus,
      sponsorId,
      borrowerNo,
      modules:
        selectedModules?.map((module: SelectedModule) => ({
          moduleId: module.id,
          moduleStatus: module.status,
        })) || [],
    });

    return res.request;
  }

  return (
    <Box p={'lg'}>
      <Form title={'Create Registration Request'} onSubmit={handleSubmit} />
    </Box>
  );
}
