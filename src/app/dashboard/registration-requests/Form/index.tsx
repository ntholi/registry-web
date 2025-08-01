'use client';

import { Form } from '@/components/adease';
import {
  modules,
  semesterModules,
  StudentModuleStatus,
  studentModuleStatusEnum,
} from '@/db/schema';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { formatSemester } from '@/lib/utils';
import { getStudentSemesterModules } from '@/server/registration-requests/actions';
import { getModulesForStructure } from '@/server/semester-modules/actions';
import { getStudent } from '@/server/students/actions';
import { getAllTerms } from '@/server/terms/actions';
import { getAcademicRemarks } from '@/utils/grades';
import {
  ActionIcon,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState, useEffect, useCallback } from 'react';
import ModulesDialog from './ModulesDialog';
import SponsorInput from './SponsorInput';
import StdNoInput from '../../base/StdNoInput';

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

type RegistrationRequest = {
  id?: number;
  stdNo: number;
  semesterStatus: 'Active' | 'Repeat';
  sponsorId: number;
  borrowerNo?: string;
  semesterNumber: number;
  termId: number;
  selectedModules?: Array<SelectedModule>;
};

type Props = {
  onSubmit: (values: RegistrationRequest) => Promise<RegistrationRequest>;
  defaultValues?: RegistrationRequest;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>
  ) => void;
  title?: string;
  structureModules?: Awaited<ReturnType<typeof getModulesForStructure>>;
  structureId?: number;
  initialStdNo?: number;
};

export default function RegistrationRequestForm({
  onSubmit,
  defaultValues,
  title,
  structureModules: initialStructureModules,
  structureId: initialStructureId,
  initialStdNo,
}: Props) {
  const router = useRouter();
  const [structureId, setStructureId] = useState<number | null>(
    initialStructureId ?? null
  );

  const { currentTerm } = useCurrentTerm();
  const { data: allTerms = [] } = useQuery({
    queryKey: ['allTerms'],
    queryFn: getAllTerms,
  });

  const { data: structureModules, isLoading } = useQuery({
    queryKey: ['structureModules', structureId],
    queryFn: async () => {
      if (structureId) {
        return getModulesForStructure(structureId);
      }
      return [];
    },
    enabled: !!structureId && !initialStructureModules,
    initialData: initialStructureModules,
  });

  const semesterOptions = structureModules
    ? [...new Set(structureModules.map((sem) => sem.id.toString()))].map(
        (id) => {
          const semester = structureModules.find((s) => s.id.toString() === id);
          return {
            value: String(semester?.semesterNumber),
            label: formatSemester(semester?.semesterNumber),
          };
        }
      )
    : [];

  const filteredModules = structureModules
    ? (structureModules.flatMap((sem) =>
        sem.semesterModules
          .filter((module) => module.module !== null)
          .map((module) => ({
            ...module,
            semesterNumber: sem.semesterNumber,
            semesterName: sem.name,
          }))
      ) as SemesterModule[])
    : [];

  const handleStudentSelect = async (stdNo: number) => {
    if (stdNo) {
      try {
        const student = await getStudent(stdNo);
        if (student && student.programs.length > 0) {
          const activeProgram = student.programs.find(
            (p) => p.status === 'Active'
          );
          if (activeProgram) {
            setStructureId(activeProgram.structureId);
          } else {
            setStructureId(null);
          }
        } else {
          setStructureId(null);
        }
      } catch (error) {
        console.error('Error fetching student:', error);
        setStructureId(null);
      }
    } else {
      setStructureId(null);
    }
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const handleLoadModules = useCallback(async (stdNo: number, form: any) => {
    if (!stdNo || !structureId) return;

    try {
      const basicStudent = await getStudent(stdNo);
      if (!basicStudent) {
        console.error('Student not found');
        return;
      }

      const student = await import('@/server/students/actions').then(
        ({ getStudentByUserId }) => getStudentByUserId(basicStudent.userId)
      );

      if (!student) {
        console.error('Student data not found');
        return;
      }

      const academicRemarks = await getAcademicRemarks(student.programs);
      const semesterData = await getStudentSemesterModules(
        student,
        academicRemarks
      );

      if (semesterData.error) {
        console.error('Error loading student modules:', semesterData.error);
        return;
      }

      const mappedModules = semesterData.modules.map((moduleData) => ({
        id: moduleData.semesterModuleId,
        type: moduleData.type,
        credits: moduleData.credits,
        status: moduleData.status as StudentModuleStatus,
        semesterModuleId: moduleData.semesterModuleId,
        semesterNumber: moduleData.semesterNo,
        semesterName: `Semester ${moduleData.semesterNo}`,
        module: {
          id: moduleData.semesterModuleId,
          code: moduleData.code,
          name: moduleData.name,
        },
      }));

      const { determineSemesterStatus } = await import(
        '@/server/registration-requests/actions'
      );
      const { semesterNo, status } = await determineSemesterStatus(
        semesterData.modules,
        student
      );

      form.setFieldValue('selectedModules', mappedModules);
      form.setFieldValue('semesterNumber', semesterNo.toString());
      form.setFieldValue('semesterStatus', status);
    } catch (error) {
      console.error('Error loading student modules:', error);
    }
  }, [structureId]);

  const [formInstance, setFormInstance] = useState<any>(null);

  useEffect(() => {
    if (initialStdNo && !defaultValues && formInstance) {
      handleStudentSelect(initialStdNo);
      const timer = setTimeout(() => {
        handleLoadModules(initialStdNo, formInstance);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialStdNo, defaultValues, formInstance, handleLoadModules]);

  return (
    <Form
      title={title}
      action={(values: RegistrationRequest) => onSubmit(values)}
      queryKey={['registrationRequests']}
      defaultValues={{
        ...defaultValues,
        stdNo: initialStdNo || defaultValues?.stdNo,
        selectedModules: defaultValues?.selectedModules || [],
        semesterNumber: defaultValues?.semesterNumber?.toString(),
        termId: defaultValues?.termId || currentTerm?.id || '',
      }}
      onSuccess={({ id }) => {
        router.push(`/dashboard/registration-requests/pending/${id}`);
      }}
    >
      {(form) => {
        const selectedModules = form.values.selectedModules || [];

        if (!formInstance) {
          setFormInstance(form);
        }

        const handleAddModuleToForm = (module: SemesterModule) => {
          const newModule: SelectedModule = {
            ...module,
            status: 'Compulsory',
          };
          if (!selectedModules.some((m) => m.id === newModule.id)) {
            form.setFieldValue('selectedModules', [
              ...selectedModules,
              newModule,
            ]);
          }
        };

        const handleRemoveModule = (moduleId: number) => {
          form.setFieldValue(
            'selectedModules',
            selectedModules.filter((m: SelectedModule) => m.id !== moduleId)
          );
        };

        const handleChangeModuleStatus = (
          moduleId: number,
          newStatus: StudentModuleStatus
        ) => {
          form.setFieldValue(
            'selectedModules',
            selectedModules.map((module: SelectedModule) =>
              module.id === moduleId ? { ...module, status: newStatus } : module
            )
          );
        };

        return (
          <Stack gap='xs'>
            <StdNoInput
              {...form.getInputProps('stdNo')}
              disabled={!!defaultValues || !!initialStdNo}
              onChange={(value) => {
                form.getInputProps('stdNo').onChange(value);
                if (value) handleStudentSelect(Number(value));
              }}
            />

            <Select
              label='Term'
              placeholder='Select term'
              data={allTerms.map((term) => ({
                value: term.id.toString(),
                label: term.name,
              }))}
              {...form.getInputProps('termId')}
              onChange={(value: string | null) => {
                form.setFieldValue('termId', Number(value));
              }}
              required
            />

            <Group grow>
              <Select
                label='Semester'
                placeholder='Select semester'
                data={semesterOptions}
                {...form.getInputProps('semesterNumber')}
                onChange={(value: string | null) => {
                  form.setFieldValue('semesterNumber', Number(value));
                }}
                disabled={!structureId || semesterOptions.length === 0}
                required
              />

              <Select
                label='Semester Status'
                data={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Repeat', label: 'Repeat' },
                ]}
                {...form.getInputProps('semesterStatus')}
                disabled={!structureId}
              />
            </Group>

            {!defaultValues && (
              <SponsorInput
                sponsorId={Number(form.values.sponsorId)}
                borrowerNo={form.values.borrowerNo}
                onSponsorChange={(value) =>
                  form.setFieldValue('sponsorId', value)
                }
                onBorrowerNoChange={(value) =>
                  form.setFieldValue('borrowerNo', value)
                }
                disabled={!structureId}
              />
            )}

            <Paper withBorder p='md' mt='md'>
              <Group justify='space-between' mb='md'>
                <Text fw={500}>Modules</Text>
                <ModulesDialog
                  onAddModule={handleAddModuleToForm}
                  modules={filteredModules}
                  isLoading={isLoading}
                  selectedModules={selectedModules}
                  disabled={
                    !structureId || !structureId || !form.values.semesterNumber
                  }
                />
              </Group>
              <Divider my='xs' />
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Credits</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedModules.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} align='center'>
                        <Text c='dimmed' size='sm'>
                          No modules selected
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    selectedModules.map((semModule: SelectedModule) => (
                      <Table.Tr key={semModule.id}>
                        <Table.Td>{semModule.module.code}</Table.Td>
                        <Table.Td>{semModule.module.name}</Table.Td>
                        <Table.Td>{semModule.type}</Table.Td>
                        <Table.Td>{semModule.credits}</Table.Td>
                        <Table.Td>
                          <Select
                            value={semModule.status}
                            onChange={(value) =>
                              handleChangeModuleStatus(
                                semModule.id,
                                value as StudentModuleStatus
                              )
                            }
                            data={studentModuleStatusEnum.map((status) => ({
                              value: status,
                              label: status,
                            }))}
                            size='xs'
                            style={{ width: '120px' }}
                            disabled={!structureId}
                          />
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            color='red'
                            onClick={() => handleRemoveModule(semModule.id)}
                            disabled={!structureId}
                          >
                            <IconTrash size='1rem' />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        );
      }}
    </Form>
  );
}
