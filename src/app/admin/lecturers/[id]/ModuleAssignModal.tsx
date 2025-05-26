'use client';
import { ModuleSearchInput } from '@/app/admin/lecturers/[id]/ModuleSearchInput';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useParams } from 'next/navigation';
import { searchModulesWithDetails } from '@/server/semester-modules/actions';
import { assignModulesToLecturer } from '@/server/assigned-modules/actions';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type FormValues = {
  userId: string;
  semesterModuleIds: number[];
};

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

export default function ModuleAssignModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const params = useParams<{ id: string }>();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedSemesterModules, setSelectedSemesterModules] = useState<
    number[]
  >([]);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    initialValues: {
      userId: params.id,
      semesterModuleIds: [],
    },
    validate: {
      semesterModuleIds: (value) =>
        value.length > 0 ? null : 'Please select at least one semester module',
    },
  });
  const assignModulesMutation = useMutation({
    mutationFn: (data: FormValues) =>
      assignModulesToLecturer(data.userId, data.semesterModuleIds),
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Modules assigned successfully',
        color: 'green',
      });

      queryClient.invalidateQueries({
        queryKey: ['assigned-modules', params.id],
      });

      form.reset();
      setSelectedModule(null);
      setSelectedSemesterModules([]);
      close();
    },
    onError: (error) => {
      console.error('Error assigning modules:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to assign modules',
        color: 'red',
      });
    },
  });

  function handleSubmit(values: FormValues) {
    assignModulesMutation.mutate({
      userId: values.userId,
      semesterModuleIds: selectedSemesterModules,
    });
  }

  const handleModuleSelect = (module: Module | null) => {
    setSelectedModule(module);
    setSelectedSemesterModules([]);
    form.setFieldValue('semesterModuleIds', []);
  };

  const handleSemesterModuleToggle = (semesterModuleId: number) => {
    const updatedSelection = selectedSemesterModules.includes(semesterModuleId)
      ? selectedSemesterModules.filter((id) => id !== semesterModuleId)
      : [...selectedSemesterModules, semesterModuleId];

    setSelectedSemesterModules(updatedSelection);
    form.setFieldValue('semesterModuleIds', updatedSelection);
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
              error={form.errors.semesterModuleIds}
              required
            />

            <Paper withBorder p='md'>
              {selectedModule ? (
                <Stack>
                  {selectedModule.semesters.map((semester) => (
                    <Checkbox.Card
                      p='md'
                      key={semester.semesterModuleId}
                      checked={selectedSemesterModules.includes(
                        semester.semesterModuleId,
                      )}
                      onChange={() =>
                        handleSemesterModuleToggle(semester.semesterModuleId)
                      }
                    >
                      <Group wrap='nowrap' align='flex-start'>
                        <Checkbox.Indicator />
                        <div>
                          <Text size='sm' fw={500}>
                            {semester.programName}
                          </Text>
                          <Text size='xs' c='dimmed'>
                            {semester.semesterName}{' '}
                            {`(${semester.studentCount} Students)`}
                          </Text>
                        </div>
                      </Group>
                    </Checkbox.Card>
                  ))}
                </Stack>
              ) : (
                <Text c='dimmed'>No module selected</Text>
              )}
            </Paper>

            {selectedModule && form.values.semesterModuleIds.length === 0 && (
              <Text size='sm' c='red'>
                {form.errors.semesterModuleIds}
              </Text>
            )}

            <Group justify='flex-end' mt='md'>
              <Button variant='subtle' onClick={close}>
                Cancel
              </Button>
              <Button
                type='submit'
                loading={assignModulesMutation.isPending}
                disabled={selectedSemesterModules.length === 0}
              >
                Assign Module
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
