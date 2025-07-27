import React from 'react';
import {
  Stack,
  Text,
  Card,
  Group,
  Badge,
  LoadingOverlay,
  Alert,
  Title,
  Button,
  SimpleGrid,
} from '@mantine/core';
import { IconInfoCircle, IconCheck } from '@tabler/icons-react';
import { StudentModuleStatus } from '@/db/schema';

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

interface SemesterConfirmationProps {
  semesterData: {
    semesterNo: number;
    status: 'Active' | 'Repeat';
  } | null;
  selectedModules: SelectedModule[];
  availableModules: ModuleWithStatus[];
  loading: boolean;
  onSemesterDataChange: (data: {
    semesterNo: number;
    status: 'Active' | 'Repeat';
  }) => void;
}

export default function SemesterConfirmation({
  semesterData,
  selectedModules,
  availableModules,
  loading,
  onSemesterDataChange,
}: SemesterConfirmationProps) {
  if (loading) {
    return (
      <div style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </div>
    );
  }

  if (!semesterData) {
    return (
      <Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
        Semester information is being calculated based on your selected
        modules...
      </Alert>
    );
  }

  const getSelectedModuleDetails = () => {
    return selectedModules
      .map((selected) => {
        const moduleDetail = availableModules.find(
          (module) => module.semesterModuleId === selected.moduleId
        );
        return moduleDetail
          ? { ...moduleDetail, selectedStatus: selected.moduleStatus }
          : null;
      })
      .filter(Boolean);
  };

  const selectedModuleDetails = getSelectedModuleDetails();
  const totalCredits = selectedModuleDetails.reduce(
    (sum, module) => sum + (module?.credits || 0),
    0
  );

  const getStatusColor = (status: 'Active' | 'Repeat') => {
    return status === 'Active' ? 'blue' : 'orange';
  };

  const handleConfirmSemester = () => {
    if (semesterData) {
      onSemesterDataChange(semesterData);
    }
  };

  return (
    <Stack gap='lg' mt='md'>
      <div>
        <Title order={4} mb='sm'>
          Confirm Your Semester
        </Title>
        <Text size='sm' c='dimmed'>
          Review your semester status and selected modules before proceeding.
        </Text>
      </div>

      <Card padding='lg' withBorder>
        <Stack gap='md'>
          <Group justify='space-between'>
            <Text fw={500} size='lg'>
              Semester Information
            </Text>
            <Badge color={getStatusColor(semesterData.status)} size='lg'>
              {semesterData.status}
            </Badge>
          </Group>

          <Group>
            <Text>Semester Number:</Text>
            <Text fw={500}>{semesterData.semesterNo}</Text>
          </Group>

          <Group>
            <Text>Total Credits:</Text>
            <Text fw={500}>{totalCredits}</Text>
          </Group>

          <Group>
            <Text>Total Modules:</Text>
            <Text fw={500}>{selectedModules.length}</Text>
          </Group>

          {semesterData.status === 'Repeat' && (
            <Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
              You are repeating this semester. This means you have previously
              attempted some of these modules and are retaking them.
            </Alert>
          )}
        </Stack>
      </Card>

      <div>
        <Text fw={500} mb='sm'>
          Selected Modules Summary
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='sm'>
          {selectedModuleDetails.map(
            (module) =>
              module && (
                <Card key={module.semesterModuleId} padding='md' withBorder>
                  <Group justify='space-between' align='flex-start'>
                    <div style={{ flex: 1 }}>
                      <Group gap='xs' mb='xs'>
                        <IconCheck size={16} color='green' />
                        <Text fw={500}>{module.code}</Text>
                        <Badge color='blue' size='sm'>
                          {module.status}
                        </Badge>
                      </Group>
                      <Text size='sm' mb='xs'>
                        {module.name}
                      </Text>
                      <Group gap='xs'>
                        <Text size='xs' c='dimmed'>
                          Credits: {module.credits}
                        </Text>
                        <Text size='xs' c='dimmed'>
                          Type: {module.type}
                        </Text>
                      </Group>
                    </div>
                  </Group>
                </Card>
              )
          )}
        </SimpleGrid>
      </div>

      <Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
        Please review the information above carefully. Once you proceed to the
        next step, you will enter your sponsorship details to complete the
        registration.
      </Alert>

      <Group justify='center'>
        <Button
          onClick={handleConfirmSemester}
          leftSection={<IconCheck size={16} />}
          disabled={!semesterData}
        >
          Confirm Semester Details
        </Button>
      </Group>
    </Stack>
  );
}
