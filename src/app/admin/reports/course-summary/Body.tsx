'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateCourseSummaryReport } from '@/server/reports/course-summary/actions';
import {
  getAssignedModulesByCurrentUser,
  getAssignedModuleByUserAndModule,
} from '@/server/assigned-modules/actions';
import {
  Card,
  CardSection,
  Text,
  Title,
  Button,
  Group,
  Loader,
  Stack,
  Select,
  Alert,
} from '@mantine/core';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { notifications } from '@mantine/notifications';
import { toClassName } from '@/lib/utils';

export default function Body() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null,
  );

  const { data: assignedModules, isLoading: modulesLoading } = useQuery({
    queryKey: ['assigned-modules-current-user'],
    queryFn: getAssignedModulesByCurrentUser,
  });

  const { data: modulePrograms, isLoading: programsLoading } = useQuery({
    queryKey: ['module-programs', selectedModuleId],
    queryFn: () => {
      if (!selectedModuleId) return Promise.resolve([]);
      const moduleIdNum = parseInt(selectedModuleId);
      const selectedModule = assignedModules?.find(
        (m) => m.semesterModule?.module?.id === moduleIdNum,
      );
      if (!selectedModule?.semesterModule?.module?.id)
        return Promise.resolve([]);
      return getAssignedModuleByUserAndModule(
        selectedModule.semesterModule.module.id,
      );
    },
    enabled: !!selectedModuleId && !!assignedModules,
  });
  const { currentTerm } = useCurrentTerm();

  const moduleOptions = useMemo(() => {
    return (
      assignedModules?.map((assignment) => ({
        value: assignment.semesterModule?.module?.id?.toString() || '',
        label: `${assignment.semesterModule?.module?.code} - ${assignment.semesterModule?.module?.name}`,
      })) || []
    );
  }, [assignedModules]);

  const programOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Programs' }];
    const seen = new Set<number>();

    modulePrograms?.forEach((module) => {
      const program = module.semesterModule?.semester?.structure.program;
      if (program && !seen.has(program.id)) {
        seen.add(program.id);
        options.push({
          value: program.id.toString(),
          label: toClassName(
            program.code || '',
            module.semesterModule?.semester?.name || '',
          ),
        });
      }
    });

    return options;
  }, [modulePrograms]);
  useEffect(() => {
    setSelectedProgramId(null);
  }, [selectedModuleId]);
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedModuleId) {
        throw new Error('Please select a module');
      }

      const selectedModule = assignedModules?.find(
        (m) => m.semesterModule?.module?.id === parseInt(selectedModuleId),
      );

      if (!selectedModule?.semesterModuleId) {
        throw new Error('Selected module not found');
      }

      setIsDownloading(true);
      try {
        const result = await generateCourseSummaryReport(
          selectedProgramId ? Number(selectedProgramId) : undefined,
          selectedModule.semesterModuleId,
        );
        if (!result.success) {
          throw new Error(result.error || 'Failed to generate report');
        }
        return result.data;
      } finally {
        setIsDownloading(false);
      }
    },
    onSuccess: (base64Data) => {
      if (!base64Data) {
        throw new Error('No data received from server');
      }
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const selectedModule = assignedModules?.find(
        (m) =>
          m.semesterModule?.module?.id === parseInt(selectedModuleId || ''),
      );
      const selectedProgram = modulePrograms?.find(
        (m) =>
          m.semesterModule?.semester?.structure.program.id ===
          Number(selectedProgramId),
      );

      const moduleCode =
        selectedModule?.semesterModule?.module?.code || 'Module';
      const programCode =
        selectedProgram?.semesterModule?.semester?.structure.program.code ||
        'All';
      a.download = `${moduleCode}_${programCode}_Course_Summary_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      console.error('Error generating course summary report:', error);
      notifications.show({
        title: 'Error',
        message: `Error generating course summary report: ${error.message}`,
        color: 'red',
      });
    },
  });
  const canGenerate = selectedModuleId;
  return (
    <Stack align='center' justify='center' p='xl'>
      <Alert
        variant='light'
        color='orange'
        title='Under Development'
        w='100%'
        maw={600}
        mb='md'
      >
        This feature is currently under development. Some functionality may be
        limited or subject to change.
      </Alert>
      <Card shadow='md' radius='md' withBorder w='100%' maw={600}>
        <CardSection inheritPadding py='md'>
          <Title order={3}>Course Summary Report Generation</Title>
          <Text c='dimmed' size='sm'>
            Generate Course Summary reports for your assigned modules
          </Text>
        </CardSection>
        <CardSection inheritPadding>
          <Stack gap='md'>
            <Text my='xs'>
              Select a module from your assigned modules to generate a course
              summary report for {currentTerm?.name}.
            </Text>

            <Select
              label='Select Module'
              placeholder='Choose a module'
              data={moduleOptions}
              value={selectedModuleId}
              onChange={setSelectedModuleId}
              disabled={modulesLoading}
              searchable
            />

            {selectedModuleId && (
              <Select
                label='Filter by Program (Optional)'
                placeholder='Select program to filter students'
                data={programOptions}
                value={selectedProgramId || ''}
                onChange={(value) =>
                  setSelectedProgramId(value === '' ? null : value)
                }
                disabled={programsLoading}
                searchable
                clearable
              />
            )}

            {modulesLoading && (
              <Group justify='center'>
                <Loader size='sm' />
                <Text size='sm' c='dimmed'>
                  Loading your assigned modules...
                </Text>
              </Group>
            )}

            {!modulesLoading && moduleOptions.length === 0 && (
              <Text size='sm' c='dimmed' ta='center'>
                No modules assigned to you for {currentTerm?.name}
              </Text>
            )}

            {selectedModuleId && programsLoading && (
              <Group justify='center'>
                <Loader size='sm' />
                <Text size='sm' c='dimmed'>
                  Loading program options...
                </Text>
              </Group>
            )}
          </Stack>
        </CardSection>
        <CardSection inheritPadding py='md'>
          <Group>
            <Button
              fullWidth
              onClick={() => generateReportMutation.mutate()}
              disabled={
                !canGenerate ||
                generateReportMutation.isPending ||
                isDownloading
              }
              leftSection={
                generateReportMutation.isPending || isDownloading ? (
                  <Loader size={16} />
                ) : null
              }
            >
              {generateReportMutation.isPending || isDownloading
                ? 'Generating Report...'
                : 'Generate Course Summary Report'}
            </Button>
          </Group>
        </CardSection>
      </Card>
    </Stack>
  );
}
