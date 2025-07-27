'use client';

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Progress,
  Group,
  Button,
  Text,
  Title,
  Alert,
  LoadingOverlay,
  Stack,
  Box,
  Badge,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconArrowLeft,
  IconArrowRight,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import useUserStudent from '@/hooks/use-user-student';
import { StudentModuleStatus } from '@/db/schema';
import {
  getStudentSemesterModules,
  determineSemesterStatus,
  createRegistrationWithModules,
} from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import ModuleSelection from './ModuleSelection';
import SemesterConfirmation from './SemesterConfirmation';
import SponsorshipDetails from './SponsorshipDetails';

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

type SelectedModule = {
  moduleId: number;
  moduleStatus: StudentModuleStatus;
};

type SponsorshipData = {
  sponsorId: number;
  borrowerNo?: string;
};

const STEPS = [
  {
    label: 'Select Modules',
    description: 'Choose your modules for this semester',
  },
  { label: 'Confirm Semester', description: 'Review your semester status' },
  {
    label: 'Sponsorship Details',
    description: 'Enter your sponsorship information',
  },
];

export default function NewRegistrationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { student, remarks, isLoading: studentLoading } = useUserStudent();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [semesterData, setSemesterData] = useState<{
    semesterNo: number;
    status: 'Active' | 'Repeat';
  } | null>(null);
  const [sponsorshipData, setSponsorshipData] =
    useState<SponsorshipData | null>(null);

  // Fetch available modules for the student
  const { data: moduleResult, isLoading: modulesLoading } = useQuery({
    queryKey: ['student-semester-modules', student?.stdNo],
    queryFn: async () => {
      if (!student || !remarks) {
        return { error: 'Missing student or remarks data', modules: [] };
      }
      return await getStudentSemesterModules(student, remarks);
    },
    enabled: !!student && !!remarks,
  });

  const availableModules = moduleResult?.modules || [];

  // Fetch current term
  const { data: currentTerm } = useQuery({
    queryKey: ['current-term'],
    queryFn: getCurrentTerm,
  });

  // Determine semester status when modules are selected
  const { data: semesterStatus, isLoading: semesterStatusLoading } = useQuery({
    queryKey: ['semester-status', selectedModules],
    queryFn: async () => {
      if (!student || !availableModules || selectedModules.length === 0) {
        return null;
      }
      const modulesWithStatus = availableModules.filter((module) =>
        selectedModules.some(
          (selected) => selected.moduleId === module.semesterModuleId
        )
      );
      return await determineSemesterStatus(modulesWithStatus, student);
    },
    enabled: !!student && !!availableModules && selectedModules.length > 0,
  });

  // Submit registration mutation
  const registrationMutation = useMutation({
    mutationFn: async () => {
      if (!student || !selectedModules || !semesterData || !sponsorshipData) {
        throw new Error('Missing required data for registration');
      }

      return createRegistrationWithModules({
        stdNo: student.stdNo,
        modules: selectedModules,
        sponsorId: sponsorshipData.sponsorId,
        semesterNumber: semesterData.semesterNo,
        semesterStatus: semesterData.status,
        borrowerNo: sponsorshipData.borrowerNo,
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Registration Successful',
        message: 'Your registration request has been submitted successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
      router.push('/student/registration');
    },
    onError: (error) => {
      notifications.show({
        title: 'Registration Failed',
        message: error.message || 'Failed to submit registration',
        color: 'red',
      });
    },
  });

  const nextStep = () => {
    if (activeStep === 0 && selectedModules.length > 0) {
      // Auto-set semester data from the query result
      if (semesterStatus) {
        setSemesterData(semesterStatus);
      }
      setActiveStep(1);
    } else if (activeStep === 1 && semesterData) {
      setActiveStep(2);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = () => {
    if (selectedModules.length > 0 && semesterData && sponsorshipData) {
      registrationMutation.mutate();
    }
  };

  const canProceedStep1 = selectedModules.length > 0;
  const canProceedStep2 = semesterData !== null;
  const canSubmit = sponsorshipData !== null;

  const progressValue = ((activeStep + 1) / STEPS.length) * 100;

  if (studentLoading || !student) {
    return (
      <Container size='lg' py='xl'>
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (!currentTerm) {
    return (
      <Container size='lg' py='xl'>
        <Alert
          icon={<IconInfoCircle size='1rem' />}
          title='No Active Term'
          color='orange'
        >
          There is currently no active registration term.
        </Alert>
      </Container>
    );
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ModuleSelection
            modules={availableModules}
            selectedModules={selectedModules}
            onSelectionChange={setSelectedModules}
            loading={modulesLoading}
          />
        );
      case 1:
        return (
          <SemesterConfirmation
            semesterData={semesterData}
            selectedModules={selectedModules}
            availableModules={availableModules}
            loading={semesterStatusLoading}
            onSemesterDataChange={setSemesterData}
          />
        );
      case 2:
        return (
          <SponsorshipDetails
            sponsorshipData={sponsorshipData}
            onSponsorshipChange={setSponsorshipData}
            loading={registrationMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container size='md'>
      <Stack gap='xl'>
        <div>
          <Title order={2} mb='xs'>
            New Registration
          </Title>
          <Text c='dimmed'>Term: {currentTerm.name}</Text>
        </div>

        <Box>
          <Group justify='space-between' mb='sm'>
            <Text size='sm' fw={500}>
              Step {activeStep + 1} of {STEPS.length}
            </Text>
          </Group>

          <Progress value={progressValue} size='lg' mb='md' />

          <Box>
            <Text fw={500} size='lg'>
              {STEPS[activeStep].label}
            </Text>
            <Text size='sm' c='dimmed'>
              {STEPS[activeStep].description}
            </Text>
          </Box>
        </Box>

        {/* Step Content */}
        <Box>{renderStepContent()}</Box>

        {/* Navigation */}
        <Group justify='space-between' mt='xl'>
          <Button
            variant='default'
            onClick={prevStep}
            disabled={activeStep === 0}
            leftSection={<IconArrowLeft size={16} />}
          >
            Back
          </Button>

          {activeStep < 2 ? (
            <Button
              onClick={nextStep}
              disabled={
                (activeStep === 0 && !canProceedStep1) ||
                (activeStep === 1 && !canProceedStep2)
              }
              rightSection={<IconArrowRight size={16} />}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={registrationMutation.isPending}
            >
              Submit Registration
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
}
