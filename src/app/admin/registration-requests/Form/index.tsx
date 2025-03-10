'use client';

import { Form } from '@/components/adease';
import {
  modules,
  ModuleStatus,
  moduleStatusEnum,
  registrationRequests,
} from '@/db/schema';
import { formatSemester } from '@/lib/utils';
import { getModulesForStructure } from '@/server/modules/actions';
import { findAllSponsors } from '@/server/sponsors/actions';
import { getStudent } from '@/server/students/actions';
import {
  ActionIcon,
  Button,
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
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import StdNoInput from '../../base/StdNoInput';
import ModulesDialog from './ModulesDialog';

interface SelectedModule extends Module {
  status: ModuleStatus;
}

type Module = typeof modules.$inferSelect;
type RegistrationRequest = typeof registrationRequests.$inferInsert & {
  selectedModules?: SelectedModule[];
};

type Props = {
  onSubmit: (
    values: RegistrationRequest,
    formData?: {
      selectedModules: SelectedModule[];
      sponsors: any[];
    },
  ) => Promise<RegistrationRequest>;
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
  const [moduleOpened, { open: openModuleModal, close: closeModuleModal }] =
    useDisclosure(false);
  const [structureId, setStructureId] = useState<number | null>(null);
  const [hasValidStudent, setHasValidStudent] = useState<boolean>(false);
  const formRef = useRef<any>(null);

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
        setHasValidStudent(true);
      } else {
        setStructureId(null);
        setHasValidStudent(false);
      }
    } else {
      setStructureId(null);
      setHasValidStudent(false);
    }
  };

  // Function for modal to access
  const handleAddModuleToForm = (module: Module) => {
    if (
      formRef.current &&
      !formRef.current.values.selectedModules?.find(
        (m: SelectedModule) => m.id === module.id,
      )
    ) {
      formRef.current.setFieldValue('selectedModules', [
        ...(formRef.current.values.selectedModules || []),
        { ...module, status: 'Compulsory' as ModuleStatus },
      ]);
    }
    closeModuleModal();
  };

  return (
    <>
      <Form
        title={title}
        action={(values: RegistrationRequest) =>
          onSubmit(values, {
            selectedModules: values.selectedModules || [],
            sponsors: sponsors || [],
          })
        }
        queryKey={['registrationRequests']}
        defaultValues={{
          ...defaultValues,
          selectedModules: defaultValues?.selectedModules || [],
        }}
        onSuccess={({ id }) => {
          router.push(`/admin/registration-requests/${id}`);
        }}
      >
        {(form) => {
          // Update form reference without causing re-render
          formRef.current = form;

          const sponsorId = form.values.sponsorId;
          const selectedSponsor = sponsorId ? String(sponsorId) : null;
          const isNMDSSponsor =
            selectedSponsor ===
            sponsors?.find((s) => s.name === 'NMDS')?.id.toString();
          const selectedSemester = form.values.semesterNumber
            ? String(form.values.semesterNumber)
            : null;

          const selectedModules = form.values.selectedModules || [];

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
                  disabled={!hasValidStudent || semesterOptions.length === 0}
                  required
                />

                <Select
                  label='Semester Status'
                  data={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Repeat', label: 'Repeat' },
                  ]}
                  {...form.getInputProps('semesterStatus')}
                  disabled={!hasValidStudent}
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
                      disabled={!hasValidStudent}
                      required
                    />
                  </GridCol>
                  <GridCol span={6}>
                    <TextInput
                      label='Borrower Number'
                      {...form.getInputProps('borrowerNo')}
                      disabled={!(hasValidStudent && isNMDSSponsor)}
                    />
                  </GridCol>
                </Grid>
              </Paper>
              <Paper withBorder p='md' mt='md'>
                <Group justify='space-between' mb='md'>
                  <Text fw={500}>Modules</Text>
                  <ActionIcon
                    onClick={openModuleModal}
                    disabled={
                      !structureId || !hasValidStudent || !selectedSemester
                    }
                  >
                    <IconPlus size='1rem' />
                  </ActionIcon>
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
                              disabled={!hasValidStudent}
                            />
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon
                              color='red'
                              onClick={() => handleRemoveModule(module.id)}
                              disabled={!hasValidStudent}
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

      <ModulesDialog
        opened={moduleOpened}
        onClose={closeModuleModal}
        onAddModule={handleAddModuleToForm}
        modules={filteredModules}
        isLoading={isLoading}
        selectedModules={formRef.current?.values?.selectedModules || []}
      />
    </>
  );
}
