'use client';
import { ModuleSearchInput } from '@/app/admin/lecturers/[id]/ModuleSearchInput';
import {
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { searchModulesWithDetails } from '@/server/semester-modules/actions';

type FormValues = {
  userId: string;
  moduleId: number;
  structureSemesterId: number;
};

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

export default function ModuleAssignModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const params = useParams<{ id: string }>();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      userId: params.id,
      moduleId: 0,
      structureSemesterId: 0,
    },
    validate: {
      moduleId: (value) => (value ? null : 'Please select a module'),
      structureSemesterId: (value) =>
        value ? null : 'Please select a semester',
    },
  });

  function handleSubmit(values: FormValues) {
    setIsSubmitting(true);

    console.log('Submitting:', values);

    setTimeout(() => {
      form.reset();
      setSelectedModule(null);
      setIsSubmitting(false);
      close();
    }, 1000);
  }

  const handleModuleSelect = (module: Module | null) => {
    setSelectedModule(module);
    form.setFieldValue('moduleId', module?.moduleId || 0);
  };

  return (
    <>
      <Button size='sm' variant='light' onClick={open}>
        Assign Module
      </Button>
      <Modal title='Assign Module' size={'xl'} opened={opened} onClose={close}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap='md'>
            <ModuleSearchInput
              onModuleSelect={handleModuleSelect}
              value={selectedModule?.moduleId}
              error={form.errors.moduleId}
              required
            />

            <Paper withBorder p='md'>
              {selectedModule ? (
                <Stack>
                  {selectedModule.semesters.map((semester) => (
                    <Group key={semester.semesterModuleId}>
                      <Text>{semester.semesterName}</Text>
                      <Text>{semester.programName}</Text>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text c='dimmed'>No module selected</Text>
              )}
            </Paper>

            <Group justify='flex-end' mt='md'>
              <Button variant='subtle' onClick={close}>
                Cancel
              </Button>
              <Button type='submit' loading={isSubmitting}>
                Assign Module
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
