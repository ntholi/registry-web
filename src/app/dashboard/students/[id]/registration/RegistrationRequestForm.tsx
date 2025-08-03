'use client';

import { StudentModuleStatus } from '@/db/schema';
import { useCurrentTerm } from '@/hooks/use-current-term';
import {
  createRegistrationWithModules,
  determineSemesterStatus,
  getStudentSemesterModules,
} from '@/server/registration-requests/actions';
import { findAllSponsors } from '@/server/sponsors/actions';
import { getAcademicHistory } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
import {
  Alert,
  Box,
  Button,
  Grid,
  GridCol,
  Group,
  LoadingOverlay,
  Paper,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import ModulesTable from './ModulesTable';
import SemesterInfoCard from './SemesterInfoCard';

type Props = {
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

type SemesterData = {
  semesterNo: number;
  status: 'Active' | 'Repeat';
};

type SponsorshipData = {
  sponsorId: number;
  borrowerNo?: string;
};

type FormValues = {
  modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
  sponsorship: SponsorshipData;
};

export default function RegistrationRequestForm({
  stdNo,
}: Omit<Props, 'opened' | 'onClose'>) {
  const { currentTerm } = useCurrentTerm();
  const queryClient = useQueryClient();
  const [selectedModules, setSelectedModules] = useState<Set<number>>(
    new Set()
  );
  const [availableModules, setAvailableModules] = useState<ModuleWithStatus[]>(
    []
  );
  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);

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
    queryFn: () => getAcademicHistory(stdNo),
    enabled: !!stdNo,
  });

  const { data: sponsors, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1),
    select: ({ items }) => items,
  });

  const { data: moduleData, isLoading: modulesLoading } = useQuery({
    queryKey: ['studentSemesterModules', stdNo],
    queryFn: async () => {
      if (!student) return null;

      const remarks = getAcademicRemarks(student.programs);
      return await getStudentSemesterModules(student, remarks);
    },
    enabled: !!student,
  });

  const { data: semesterStatus, isLoading: semesterStatusLoading } = useQuery({
    queryKey: ['semesterStatus', Array.from(selectedModules)],
    queryFn: async () => {
      if (selectedModules.size === 0 || !student || !availableModules.length)
        return null;

      const selectedModuleData: ModuleWithStatus[] = availableModules.filter(
        (m) => selectedModules.has(m.semesterModuleId)
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
      handleReset();
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

  const handleReset = () => {
    form.reset();
    setSelectedModules(new Set());
    setAvailableModules([]);
    setSemesterData(null);
  };

  const isNMDS = (sponsorId: number) => {
    return sponsors?.find((s) => s.id === sponsorId)?.name === 'NMDS';
  };

  const isLoading = studentLoading || modulesLoading || sponsorsLoading;
  const hasError = moduleData?.error;

  return (
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
                <ModulesTable
                  modules={availableModules}
                  selectedModules={selectedModules}
                  onModuleToggle={handleModuleToggle}
                  error={form.errors.modules as string}
                />
              </Box>

              <SemesterInfoCard
                semesterData={semesterData}
                selectedModules={selectedModules}
                onSemesterChange={setSemesterData}
              />

              <Paper withBorder p='md'>
                <Title order={4} size='h5' mb='md'>
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
                          form.values.sponsorship.sponsorId?.toString() || null
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
                        required={isNMDS(form.values.sponsorship.sponsorId)}
                        error={form.errors['sponsorship.borrowerNo']}
                      />
                    </GridCol>
                  </Grid>
                </Paper>
              </Paper>
            </>
          )}

          {!hasError && availableModules.length === 0 && !isLoading && (
            <Alert color='blue' icon={<IconInfoCircle size={16} />}>
              No modules available for registration
            </Alert>
          )}

          <Group justify='flex-end'>
            <Button variant='outline' onClick={handleReset}>
              Reset
            </Button>
            <Button
              type='submit'
              loading={createMutation.isPending}
              disabled={selectedModules.size === 0 || !semesterData}
            >
              Create Registration Request
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
