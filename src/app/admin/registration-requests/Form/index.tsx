'use client';

import { Form } from '@/components/adease';
import { modules, ModuleStatus, moduleStatusEnum } from '@/db/schema';
import { formatSemester } from '@/lib/utils';
import { getModulesForStructure } from '@/server/modules/actions';
import { findAllSponsors } from '@/server/sponsors/actions';
import { getStudent } from '@/server/students/actions';
import {
  ActionIcon,
  Divider,
  Grid,
  GridCol,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import StdNoInput from '../../base/StdNoInput';
import ModulesDialog from './ModulesDialog';

interface SelectedModule extends Module {
  status: ModuleStatus;
}

type Module = typeof modules.$inferSelect;

type RegistrationRequest = {
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
  onSuccess?: (value: RegistrationRequest) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

export default function RegistrationRequestForm({
  onSubmit,
  defaultValues,
  title,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [structureId, setStructureId] = useState<number | null>(null);
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);

  const { data: structureModules, isLoading } = useQuery({
    queryKey: ['structureModules', structureId],
    queryFn: async () => {
      if (structureId) {
        return getModulesForStructure(structureId);
      }
      return [];
    },
    enabled: !!structureId,
  });

  const { data: sponsors } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1),
    select: (data) => data.data,
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
    ? structureModules.flatMap((sem) => sem.modules)
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

  return (
    <Form
      title={title}
      action={(values: RegistrationRequest) => onSubmit(values)}
      queryKey={['registrationRequests']}
      defaultValues={{
        ...defaultValues,
        selectedModules: defaultValues?.selectedModules || [],
      }}
      // onSuccess={({ id }) => {
      //   router.push(`/admin/registration-requests/${id}`);
      // }}
    >
      {(form) => {
        const selectedModules = form.values.selectedModules || [];

        const handleAddModuleToForm = (module: Module) => {
          const newModule: SelectedModule = {
            ...module,
            status: moduleStatusEnum[0],
          };
          if (!selectedModules.some((m) => m.id === newModule.id)) {
            setSelectedModules((prev) => [...prev, newModule]);
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
            <StdNoInput
              {...form.getInputProps('stdNo')}
              onChange={(value) => {
                form.getInputProps('stdNo').onChange(value);
                if (value) handleStudentSelect(Number(value));
              }}
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

            <Paper withBorder p='md'>
              <Text fw={500} mb='sm'>
                Sponsorship Information
              </Text>
              <Grid>
                <GridCol span={6}>
                  <Select
                    label='Sponsor'
                    data={
                      sponsors?.map((sponsor) => ({
                        value: sponsor.id.toString(),
                        label: sponsor.name,
                      })) || []
                    }
                    {...form.getInputProps('sponsorId')}
                    onChange={(value: string | null) => {
                      form.setFieldValue('sponsorId', Number(value));
                    }}
                    placeholder='Select sponsor'
                    clearable
                    disabled={!structureId}
                    required
                  />
                </GridCol>
                <GridCol span={6}>
                  <TextInput
                    label='Borrower Number'
                    {...form.getInputProps('borrowerNo')}
                    disabled={
                      !(structureId && isNMDS(form.values.sponsorId, sponsors))
                    }
                  />
                </GridCol>
              </Grid>
            </Paper>
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
                    selectedModules.map((module: SelectedModule) => (
                      <Table.Tr key={module.id}>
                        <Table.Td>{module.code}</Table.Td>
                        <Table.Td>{module.name}</Table.Td>
                        <Table.Td>{module.type}</Table.Td>
                        <Table.Td>{module.credits}</Table.Td>
                        <Table.Td>
                          <Select
                            value={module.status}
                            onChange={(value) =>
                              handleChangeModuleStatus(
                                module.id,
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
                            onClick={() => handleRemoveModule(module.id)}
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

function isNMDS(
  sponsorId: number,
  sponsors?: Array<{ id: number; name: string }>,
) {
  if (!sponsors) return false;
  return sponsorId === sponsors.find((s) => s.name === 'NMDS')?.id;
}
