import { modules, semesterModules, StudentModuleStatus } from '@/db/schema';
import { createRegistrationWithModules } from '@/server/registration-requests/actions';
import { Box, Paper } from '@mantine/core';
import Form from '../Form';

type Module = typeof modules.$inferSelect;

type SemesterModule = typeof semesterModules.$inferSelect & {
  semesterNumber?: number;
  semesterName?: string;
  module: Module;
};

interface SelectedModule extends SemesterModule {
  status: StudentModuleStatus;
  semesterNumber?: number;
  semesterName?: string;
}

export type RegistrationRequest = {
  id?: number;
  stdNo: number;
  semesterStatus: 'Active' | 'Repeat';
  sponsorId: number;
  borrowerNo?: string;
  semesterNumber: number;
  termId: number;
  selectedModules?: Array<SelectedModule>;
};

export default async function NewPage({
  searchParams,
}: {
  searchParams: { stdNo?: string };
}) {
  const stdNo = searchParams.stdNo ? parseInt(searchParams.stdNo) : undefined;
  async function handleSubmit(values: RegistrationRequest) {
    'use server';
    const {
      stdNo,
      semesterStatus,
      sponsorId,
      borrowerNo,
      semesterNumber,
      termId,
      selectedModules,
    } = values;

    const res = await createRegistrationWithModules({
      stdNo: stdNo,
      semesterNumber,
      semesterStatus,
      sponsorId,
      borrowerNo,
      termId,
      modules:
        selectedModules?.map((module: SelectedModule) => ({
          moduleId: module.id,
          moduleStatus: module.status,
        })) || [],
    });

    return {
      id: res.request.id,
      stdNo: res.request.stdNo,
      semesterStatus: res.request.semesterStatus,
      sponsorId: res.request.sponsorId,
      borrowerNo: borrowerNo,
      semesterNumber: res.request.semesterNumber,
      termId: res.request.termId,
      selectedModules: values.selectedModules,
    };
  }

  return (
    <Box p={'lg'}>
      <Paper withBorder p='md'>
        <Form
          title={'Create Registration Request'}
          onSubmit={handleSubmit}
          initialStdNo={stdNo}
        />
      </Paper>
    </Box>
  );
}
