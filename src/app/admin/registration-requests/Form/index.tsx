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
import { updateRegistrationWithModules } from '@/server/registration-requests/actions';
import {
  findAllSponsors,
  updateStudentSponsorship,
} from '@/server/sponsors/actions';
import { getStudent } from '@/server/students/actions';
import {
  ActionIcon,
  Button,
  Divider,
  Grid,
  GridCol,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import StdNoInput from '../../base/StdNoInput';

type RegistrationRequest = typeof registrationRequests.$inferInsert;
type Module = typeof modules.$inferSelect;

type Props = {
  onSubmit: (values: RegistrationRequest) => Promise<RegistrationRequest>;
  defaultValues?: RegistrationRequest;
  onSuccess?: (value: RegistrationRequest) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
};

interface SelectedModule extends Module {
  status: ModuleStatus;
}

export default function RegistrationRequestForm({
  onSubmit,
  defaultValues,
  title,
  onSuccess,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleOpened, { open: openModuleModal, close: closeModuleModal }] =
    useDisclosure(false);
  const [structureId, setStructureId] = useState<number | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<string | null>(null);
  const [borrowerNo, setBorrowerNo] = useState<string>('');
  const [hasValidStudent, setHasValidStudent] = useState<boolean>(false);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

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
    ? structureModules.flatMap((sem) =>
        sem.modules.filter(
          (mod) =>
            mod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mod.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    : [];

  const handleAddModule = (module: Module) => {
    if (!selectedModules.find((m) => m.id === module.id)) {
      setSelectedModules([
        ...selectedModules,
        { ...module, status: 'Compulsory' },
      ]);
    }
    closeModuleModal();
  };

  const handleRemoveModule = (moduleId: number) => {
    setSelectedModules(selectedModules.filter((m) => m.id !== moduleId));
  };

  const handleChangeModuleStatus = (
    moduleId: number,
    newStatus: ModuleStatus,
  ) => {
    setSelectedModules(
      selectedModules.map((module) =>
        module.id === moduleId ? { ...module, status: newStatus } : module,
      ),
    );
  };

  const handleStudentSelect = async (stdNo: number) => {
    if (stdNo) {
      const student = await getStudent(stdNo);
      if (student && student.structureId) {
        setStructureId(student.structureId);
        setHasValidStudent(true);
        setSelectedSemester(null);
      } else {
        setHasValidStudent(false);
        setSelectedSemester(null);
      }
    } else {
      setHasValidStudent(false);
      setSelectedSemester(null);
    }
  };

  const processFormSubmission = async (values: RegistrationRequest) => {
    try {
      const result = await onSubmit({
        ...values,
        sponsorId: selectedSponsor ? parseInt(selectedSponsor) : undefined,
      });

      if (result && result.id && selectedModules.length > 0) {
        await updateRegistrationWithModules(
          result.id,
          selectedModules.map((module) => ({
            id: module.id,
            status: module.status,
          })),
        );

        if (selectedSponsor) {
          const selectedSponsorObj = sponsors?.find(
            (s) => s.id.toString() === selectedSponsor,
          );

          if (selectedSponsorObj) {
            await updateStudentSponsorship({
              stdNo: Number(values.stdNo),
              termId: Number(values.termId),
              sponsorName: selectedSponsorObj.name,
              borrowerNo:
                selectedSponsorObj.name === 'NMDS' ? borrowerNo : undefined,
            });
          }
        }

        queryClient.invalidateQueries({
          queryKey: ['registrationRequest', result.id],
        });
      }

      if (result && result.id && onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('Error submitting registration request:', error);
      throw error;
    }
  };

  return (
    <>
      <Form
        title={title}
        action={processFormSubmission}
        queryKey={['registrationRequests']}
        schema={createInsertSchema(registrationRequests)}
        defaultValues={defaultValues}
        onSuccess={({ id }) => {
          router.push(`/admin/registration-requests/${id}`);
        }}
      >
        {(form) => (
          <Stack gap='xs'>
            <StdNoInput
              {...form.getInputProps('stdNo')}
              onChange={(value) => {
                form.getInputProps('stdNo').onChange(value);
                if (value) handleStudentSelect(Number(value));
              }}
            />

            <Select
              label='Semester'
              description='Select the semester the student is registering for'
              placeholder='Select semester'
              data={semesterOptions}
              value={selectedSemester}
              onChange={setSelectedSemester}
              disabled={!hasValidStudent || semesterOptions.length === 0}
              required
            />

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
                    value={selectedSponsor}
                    onChange={setSelectedSponsor}
                    placeholder='Select sponsor'
                    clearable
                    disabled={!hasValidStudent}
                  />
                </GridCol>
                <GridCol span={6}>
                  <TextInput
                    label='Borrower Number'
                    value={borrowerNo}
                    onChange={(e) => setBorrowerNo(e.target.value)}
                    disabled={
                      !(
                        hasValidStudent &&
                        selectedSponsor &&
                        selectedSponsor ===
                          sponsors
                            ?.find((s) => s.name === 'NMDS')
                            ?.id.toString()
                      )
                    }
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
                    selectedModules.map((module) => (
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
        )}
      </Form>

      <Modal
        opened={moduleOpened}
        onClose={closeModuleModal}
        title='Select Module'
        size='lg'
      >
        <Stack>
          <TextInput
            placeholder='Search modules...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size='1rem' />}
          />

          <Paper style={{ maxHeight: '400px', overflow: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Credits</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} align='center'>
                      <Text>Loading modules...</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : filteredModules.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} align='center'>
                      <Text c='dimmed'>No modules found</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredModules.map((module) => (
                    <Table.Tr key={module.id}>
                      <Table.Td>{module.code}</Table.Td>
                      <Table.Td>{module.name}</Table.Td>
                      <Table.Td>{module.type}</Table.Td>
                      <Table.Td>{module.credits}</Table.Td>
                      <Table.Td>
                        <Button
                          size='xs'
                          variant='light'
                          onClick={() => handleAddModule(module)}
                          disabled={selectedModules.some(
                            (m) => m.id === module.id,
                          )}
                        >
                          {selectedModules.some((m) => m.id === module.id)
                            ? 'Added'
                            : 'Add'}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>
      </Modal>
    </>
  );
}
