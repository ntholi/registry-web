import { modules, ModuleStatus, registrationRequests } from '@/db/schema';
import { createRegistrationWithModules } from '@/server/registration-requests/actions';
import { Box } from '@mantine/core';
import Form from '../Form';

type RegistrationRequest = typeof registrationRequests.$inferInsert;
type Module = typeof modules.$inferSelect;

interface SelectedModule extends Module {
  status: ModuleStatus;
}

interface FormData {
  sponsor: string | null;
  semester: string | null;
  semesterStatus: 'Active' | 'Repeat';
  selectedModules: SelectedModule[];
  borrowerNo: string;
  sponsors: Array<{ id: number; name: string }>;
}

export default async function NewPage() {
  async function handleSubmit(
    values: RegistrationRequest,
    formData?: FormData,
  ) {
    'use server';

    console.log('values', values);
    console.log('formData', formData);

    return 0;

    if (!formData) return values;

    const {
      sponsor,
      semester,
      semesterStatus,
      selectedModules,
      borrowerNo,
      sponsors,
    } = formData;

    try {
      if (!sponsor) {
        throw new Error('Sponsor is required');
      }

      if (!semester) {
        throw new Error('Semester is required');
      }

      if (selectedModules.length === 0) {
        throw new Error('At least one module must be selected');
      }

      const result = await createRegistrationWithModules({
        stdNo: Number(values.stdNo),
        semesterNumber: Number(semester),
        semesterStatus: semesterStatus,
        sponsor:
          sponsors?.find(
            (s: { id: number; name: string }) => s.id.toString() === sponsor,
          )?.name || '',
        borrowerNo:
          sponsor &&
          sponsors?.find(
            (s: { id: number; name: string }) => s.id.toString() === sponsor,
          )?.name === 'NMDS'
            ? borrowerNo
            : undefined,
        modules: selectedModules.map((module: SelectedModule) => ({
          moduleId: module.id,
          moduleStatus: module.status,
        })),
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
