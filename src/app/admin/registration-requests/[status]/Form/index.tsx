'use client';

import { getStudentSemesterModules } from '@/app/(main)/(auth)/registration/request/actions';
import { Form } from '@/components/adease';
import {
  semesterModules,
  ModuleStatus,
  moduleStatusEnum,
  modules,
} from '@/db/schema';
import { formatSemester } from '@/lib/utils';
import { getModulesForStructure } from '@/server/semester-modules/actions';
import { getStudent } from '@/server/students/actions';
import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconDownload, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import StdNoInput from '../../../base/StdNoInput';
import ModulesDialog from './ModulesDialog';
import SponsorInput from './SponsorInput';

type Module = typeof modules.$inferSelect;

type SemesterModule = typeof semesterModules.$inferSelect & {
  semesterNumber?: number;
  semesterName?: string;
  module: Module;
};

interface SelectedModule extends SemesterModule {
  status: ModuleStatus;
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
  selectedModules?: Array<SelectedModule>;
};

type Props = {
  onSubmit: (values: RegistrationRequest) => Promise<RegistrationRequest>;
  defaultValues?: RegistrationRequest;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
  structureModules?: Awaited<ReturnType<typeof getModulesForStructure>>;
  structureId?: number;
};

export default function RegistrationRequestForm({
  onSubmit,
  defaultValues,
  title,
  structureModules: initialStructureModules,
  structureId: initialStructureId,
}: Props) {
  const router = useRouter();
  const [structureId, setStructureId] = useState<number | null>(
    initialStructureId ?? null,
  );
  const [isLoadingModules, setIsLoadingModules] = useState(false);

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
        },
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
          })),
      ) as SemesterModule[])
    : [];

  const handleStudentSelect = async (stdNo: number) => {
    if (stdNo) {
      const student = await getStudent(stdNo);
      if (student && student.structureId) {
        setStructureId(student.structureId);
      } else {
        setStructureId(null);
      }
    } else {
      setStructureId(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadModules = async (stdNo: number, form: any) => {
    if (!stdNo || !structureId) return;

    setIsLoadingModules(true);
    try {
      const semesterData = await getStudentSemesterModules(stdNo, structureId);
      const mappedModules = semesterData.modules.map((moduleData) => ({
        id: moduleData.id,
        type: moduleData.type,
        credits: moduleData.credits,
        status: moduleData.status as ModuleStatus,
        module: {
          id: moduleData.id,
          code: moduleData.code,
          name: moduleData.name,
        },
      }));

      form.setFieldValue('selectedModules', mappedModules);
      form.setFieldValue('semesterNumber', semesterData.semesterNo.toString());
      form.setFieldValue('semesterStatus', semesterData.semesterStatus);
    } catch (error) {
      console.error('Error loading student modules:', error);
    } finally {
      setIsLoadingModules(false);
    }
  };

  return (
    <Form
      title={title}
      action={(values: RegistrationRequest) => onSubmit(values)}
      queryKey={['registrationRequests']}
      defaultValues={{
        ...defaultValues,
        selectedModules: defaultValues?.selectedModules || [],
        semesterNumber: defaultValues?.semesterNumber.toString(),
      }}
      onSuccess={({ id }) => {
        router.push(`/admin/registration-requests/pending/${id}`);
      }}
    >
      {(form) => {
        const selectedModules = form.values.selectedModules || [];

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
            selectedModules.filter((m: SelectedModule) => m.id !== moduleId),
          );
        };

        const handleChangeModuleStatus = (
          moduleId: number,
          newStatus: ModuleStatus,
        ) => {
          form.setFieldValue(
            'selectedModules',
            selectedModules.map((module: SelectedModule) =>
              module.id === moduleId
                ? { ...module, status: newStatus }
                : module,
            ),
          );
        };

        return (
          <Stack gap='xs'>
            <Group align='center'>
              <div style={{ flexGrow: 1 }}>
                <StdNoInput
                  {...form.getInputProps('stdNo')}
                  disabled={!!defaultValues}
                  onChange={(value) => {
                    form.getInputProps('stdNo').onChange(value);
                    if (value) handleStudentSelect(Number(value));
                  }}
                />
              </div>
              <Button
                onClick={() =>
                  handleLoadModules(Number(form.values.stdNo), form)
                }
                disabled={
                  !form.values.stdNo || !structureId || isLoadingModules
                }
                loading={isLoadingModules}
                variant='light'
                leftSection={<IconDownload size={16} />}
              >
                Load
              </Button>
            </Group>

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
                                value as ModuleStatus,
                              )
                            }
                            data={moduleStatusEnum.map((status) => ({
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
