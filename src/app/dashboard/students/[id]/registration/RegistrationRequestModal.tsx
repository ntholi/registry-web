'use client';

import { StudentModuleStatus } from '@/db/schema';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { formatSemester } from '@/lib/utils';
import { createRegistrationWithModules } from '@/server/registration-requests/actions';
import { findAllSponsors } from '@/server/sponsors/actions';
import { getStudent, getStudentByUserId } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Grid,
  GridCol,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

type Props = {
  opened: boolean;
  onClose: () => void;
  stdNo: number;
};

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type SponsorshipData = {
  sponsorId: number;
  borrowerNo?: string;
};

type FormValues = {
  modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
  sponsorship: SponsorshipData;
};

export default function RegistrationRequestModal({
  opened,
  onClose,
  stdNo,
}: Props) {
  const { currentTerm } = useCurrentTerm();
  const queryClient = useQueryClient();
  const [selectedModules, setSelectedModules] = useState<Set<number>>(
    new Set()
  );
  const [availableModules, setAvailableModules] = useState<ModuleWithStatus[]>(
    []
  );
  const [semesterData, setSemesterData] = useState<{
    semesterNo: number;
    status: 'Active' | 'Repeat';
  } | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      modules: [],
      sponsorship: {
        sponsorId: 0,
        borrowerNo: '',
      },
    },
    validate: {
      modules: (value) =>
        value.length === 0 ? 'Please select at least one module' : null,
      sponsorship: {
        sponsorId: (value) => (value === 0 ? 'Please select a sponsor' : null),
        borrowerNo: (value, values) => {
          const sponsor = sponsors?.find(
            (s) => s.id === values.sponsorship.sponsorId
          );
          if (sponsor?.name === 'NMDS' && !value) {
            return 'Borrower number is required for NMDS sponsorship';
          }
          return null;
        },
      },
    },
  });

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', stdNo],
    queryFn: async () => {
      const basicStudent = await getStudent(stdNo);
      if (!basicStudent?.userId) return null;
      return getStudentByUserId(basicStudent.userId);
    },
    enabled: opened && !!stdNo,
  });

  const { data: sponsors, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1),
    select: ({ items }) => items,
    enabled: opened,
  });

  const { data: moduleData, isLoading: modulesLoading } = useQuery({
    queryKey: ['studentSemesterModules', stdNo],
    queryFn: async () => {
      if (!student) return null;

      const remarks = getAcademicRemarks(student.programs);
      const { getStudentSemesterModules } = await import(
        '@/server/registration-requests/actions'
      );
      return getStudentSemesterModules(student, remarks);
    },
    enabled: opened && !!student,
  });

  const { data: semesterStatus, isLoading: semesterStatusLoading } = useQuery({
    queryKey: ['semesterStatus', Array.from(selectedModules)],
    queryFn: async () => {
      if (selectedModules.size === 0 || !student || !availableModules.length)
        return null;

      const selectedModuleData: ModuleWithStatus[] = availableModules.filter(
        (m) => selectedModules.has(m.semesterModuleId)
      );

      const { determineSemesterStatus } = await import(
        '@/server/registration-requests/actions'
      );
      return determineSemesterStatus(selectedModuleData, student);
    },
    enabled:
      selectedModules.size > 0 && !!student && availableModules.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!currentTerm || !semesterData) {
        throw new Error('Missing required data');
      }

      return createRegistrationWithModules({
        stdNo,
        termId: currentTerm.id,
        sponsorId: data.sponsorship.sponsorId,
        modules: data.modules,
        semesterNumber: semesterData.semesterNo,
        semesterStatus: semesterData.status,
        borrowerNo: data.sponsorship.borrowerNo,
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Registration request created successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({
        queryKey: ['registrationRequests', stdNo],
      });
      handleClose();
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create registration request',
        color: 'red',
        icon: <IconX size={16} />,
      });
    },
  });

  useEffect(() => {
    if (moduleData?.modules) {
      setAvailableModules(moduleData.modules);
    }
  }, [moduleData]);

  useEffect(() => {
    if (semesterStatus) {
      setSemesterData(semesterStatus);
    }
  }, [semesterStatus]);

  const handleModuleToggle = (semesterModuleId: number) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(semesterModuleId)) {
      newSelected.delete(semesterModuleId);
    } else {
      newSelected.add(semesterModuleId);
    }
    setSelectedModules(newSelected);

    const selectedModulesList = availableModules
      .filter((m) => newSelected.has(m.semesterModuleId))
      .map((m) => ({
        moduleId: m.semesterModuleId,
        moduleStatus: m.status.includes('Repeat')
          ? ('Repeat' as StudentModuleStatus)
          : ('Active' as StudentModuleStatus),
      }));

    form.setFieldValue('modules', selectedModulesList);
  };

  const handleSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  const handleClose = () => {
    form.reset();
    setSelectedModules(new Set());
    setAvailableModules([]);
    setSemesterData(null);
    onClose();
  };

  const isNMDS = (sponsorId: number) => {
    return sponsors?.find((s) => s.id === sponsorId)?.name === 'NMDS';
  };

  const isLoading = studentLoading || modulesLoading || sponsorsLoading;
  const hasError = moduleData?.error;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title='Create Registration Request'
      size='xl'
      centered
      closeOnEscape
    >
      <Box pos='relative'>
        <LoadingOverlay visible={isLoading} />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap='lg'>
            {hasError && (
              <Alert color='red' icon={<IconInfoCircle size={16} />}>
                {hasError}
              </Alert>
            )}

            {!hasError && availableModules.length > 0 && (
              <>
                <Box>
                  <Title order={4} mb='md'>
                    Available Modules
                  </Title>
                  <Paper withBorder>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Select</Table.Th>
                          <Table.Th>Code</Table.Th>
                          <Table.Th>Module Name</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Credits</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Semester</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {availableModules.map((module) => (
                          <Table.Tr key={module.semesterModuleId}>
                            <Table.Td>
                              <Checkbox
                                checked={selectedModules.has(
                                  module.semesterModuleId
                                )}
                                onChange={() =>
                                  handleModuleToggle(module.semesterModuleId)
                                }
                              />
                            </Table.Td>
                            <Table.Td>
                              <Text fw={500} size='sm'>
                                {module.code}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>{module.name}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>{module.type}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>{module.credits}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                size='sm'
                                color={
                                  module.status === 'Compulsory'
                                    ? 'blue'
                                    : module.status === 'Elective'
                                      ? 'green'
                                      : 'orange'
                                }
                              >
                                {module.status}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>
                                {formatSemester(module.semesterNo)}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                  {form.errors.modules && (
                    <Text size='sm' c='red' mt='xs'>
                      {form.errors.modules}
                    </Text>
                  )}
                </Box>

                {selectedModules.size > 0 && (
                  <Card withBorder p='md' pos='relative'>
                    <LoadingOverlay visible={semesterStatusLoading} />
                    {semesterData && (
                      <Stack gap='xs'>
                        <Group justify='space-between'>
                          <Text fw={500}>Semester Information</Text>
                          <Badge
                            color={
                              semesterData.status === 'Active'
                                ? 'blue'
                                : 'orange'
                            }
                          >
                            {semesterData.status}
                          </Badge>
                        </Group>
                        <Group>
                          <Text size='sm'>
                            Semester: {formatSemester(semesterData.semesterNo)}
                          </Text>
                          <Text size='sm'>Modules: {selectedModules.size}</Text>
                          <Text size='sm'>
                            Credits:{' '}
                            {availableModules
                              .filter((m) =>
                                selectedModules.has(m.semesterModuleId)
                              )
                              .reduce((sum, m) => sum + m.credits, 0)}
                          </Text>
                        </Group>
                        {semesterData.status === 'Repeat' && (
                          <Alert color='orange'>
                            Student is repeating this semester
                          </Alert>
                        )}
                      </Stack>
                    )}
                    {!semesterData && (
                      <Stack gap='xs'>
                        <Text fw={500}>Determining semester status...</Text>
                      </Stack>
                    )}
                  </Card>
                )}

                <Box>
                  <Title order={4} mb='md'>
                    Sponsorship Details
                  </Title>
                  <Paper withBorder p='md'>
                    <Grid>
                      <GridCol span={6}>
                        <Select
                          label='Sponsor'
                          placeholder='Select sponsor'
                          data={
                            sponsors?.map((sponsor) => ({
                              value: sponsor.id.toString(),
                              label: sponsor.name,
                            })) || []
                          }
                          value={
                            form.values.sponsorship.sponsorId?.toString() ||
                            null
                          }
                          onChange={(value) => {
                            const sponsorId = value ? parseInt(value) : 0;
                            form.setFieldValue(
                              'sponsorship.sponsorId',
                              sponsorId
                            );
                            if (!isNMDS(sponsorId)) {
                              form.setFieldValue('sponsorship.borrowerNo', '');
                            }
                          }}
                          error={form.errors['sponsorship.sponsorId']}
                          required
                          disabled={sponsorsLoading}
                        />
                      </GridCol>
                      <GridCol span={6}>
                        <TextInput
                          label='Borrower Number'
                          placeholder='Enter borrower number'
                          value={form.values.sponsorship.borrowerNo || ''}
                          onChange={(event) =>
                            form.setFieldValue(
                              'sponsorship.borrowerNo',
                              event.currentTarget.value
                            )
                          }
                          disabled={
                            !form.values.sponsorship.sponsorId ||
                            !isNMDS(form.values.sponsorship.sponsorId)
                          }
                          description={
                            isNMDS(form.values.sponsorship.sponsorId)
                              ? 'Required for NMDS'
                              : undefined
                          }
                          required={isNMDS(form.values.sponsorship.sponsorId)}
                          error={form.errors['sponsorship.borrowerNo']}
                        />
                      </GridCol>
                    </Grid>
                  </Paper>
                </Box>
              </>
            )}

            {!hasError && availableModules.length === 0 && !isLoading && (
              <Alert color='blue' icon={<IconInfoCircle size={16} />}>
                No modules available for registration
              </Alert>
            )}

            <Group justify='flex-end'>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type='submit'
                loading={createMutation.isPending || semesterStatusLoading}
                disabled={selectedModules.size === 0 || !semesterData}
              >
                Create Registration Request
              </Button>
            </Group>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
}
