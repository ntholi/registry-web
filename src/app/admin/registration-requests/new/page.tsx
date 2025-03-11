import { modules, ModuleStatus } from '@/db/schema';
import { createRegistrationWithModules } from '@/server/registration-requests/actions';
import { Box } from '@mantine/core';
import Form from '../Form';
import { getCurrentTerm } from '@/server/terms/actions';

type Module = typeof modules.$inferSelect;
interface SelectedModule extends Module {
  status: ModuleStatus;
}

type RegistrationRequest = {
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
    try {
      const result = await createRegistrationWithModules({
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

      if (result && result.request && result.request.id) {
        return result.request;
      }

      return values;
    } catch (error) {
      console.error('Error submitting registration request:', error);
      throw error;
    }
  }

  return (
    <Box p={'lg'}>
      <Form title={'Create Registration Request'} onSubmit={handleSubmit} />
    </Box>
  );
}
