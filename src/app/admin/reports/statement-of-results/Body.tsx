'use client';
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateStatementOfResultsReport } from '@/server/reports/statement-of-results/actions';
import {
  getSchools,
  getProgramsBySchool,
} from '@/server/semester-modules/actions';
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
} from '@mantine/core';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { useUserSchools } from '@/hooks/use-user-schools';
import { notifications } from '@mantine/notifications';

export default function Body() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null,
  );
  const [selectedTermName, setSelectedTermName] = useState<string | null>(null);

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['programs', selectedSchoolId],
    queryFn: () => {
      if (!selectedSchoolId) return Promise.resolve([]);
      return getProgramsBySchool(parseInt(selectedSchoolId));
    },
    enabled: !!selectedSchoolId,
  });

  const { currentTerm } = useCurrentTerm();
  const { userSchools, isLoading: userSchoolsLoading } = useUserSchools();

  React.useEffect(() => {
    if (!selectedSchoolId && userSchools.length > 0) {
      setSelectedSchoolId(userSchools[0].school.id.toString());
    }
  }, [userSchools, selectedSchoolId]);

  React.useEffect(() => {
    if (currentTerm && !selectedTermName) {
      setSelectedTermName(currentTerm.name);
    }
  }, [currentTerm, selectedTermName]);

  React.useEffect(() => {
    setSelectedProgramId(null);
  }, [selectedSchoolId]);

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSchoolId || !selectedProgramId) {
        throw new Error('Please select a school and program');
      }
      setIsDownloading(true);
      try {
        const result = await generateStatementOfResultsReport(
          parseInt(selectedSchoolId),
          parseInt(selectedProgramId),
          selectedTermName || undefined,
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
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const selectedSchool = schools?.find(
        (s) => s.id === parseInt(selectedSchoolId!),
      );
      const selectedProgram = programs?.find(
        (p) => p.id === parseInt(selectedProgramId!),
      );
      const schoolCode = selectedSchool?.code || 'School';
      const programCode = selectedProgram?.code || 'Program';
      const termCode = selectedTermName || 'Term';
      a.download = `${schoolCode}_${programCode}_Statement_Of_Results_${termCode}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notifications.show({
        title: 'Success',
        message: 'Statement of Results report generated successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      console.error('Error generating Statement of Results report:', error);
      notifications.show({
        title: 'Error',
        message: `Error generating Statement of Results report: ${error.message}`,
        color: 'red',
      });
    },
  });

  const schoolOptions =
    schools?.map((school) => ({
      value: school.id.toString(),
      label: school.name,
    })) || [];

  const programOptions =
    programs?.map((program) => ({
      value: program.id.toString(),
      label: `${program.code} - ${program.name}`,
    })) || [];

  const termOptions = currentTerm
    ? [{ value: currentTerm.name, label: currentTerm.name }]
    : [];

  return (
    <Stack align='center' justify='center' p='xl'>
      <Card shadow='md' radius='md' withBorder w='100%' maw={600}>
        <CardSection inheritPadding py='md'>
          <Title order={3}>Statement of Results Report Generation</Title>
          <Text c='dimmed' size='sm'>
            Generate Statement of Results reports for multiple students
          </Text>
        </CardSection>
        <CardSection inheritPadding>
          <Stack gap='md'>
            <Text my='xs'>
              Select a school, program, and term to generate Statement of
              Results reports for all students in that program with the selected
              term.
            </Text>

            <Select
              label='Select School'
              placeholder='Choose a school'
              data={schoolOptions}
              value={selectedSchoolId}
              onChange={setSelectedSchoolId}
              disabled={schoolsLoading || userSchoolsLoading}
              searchable
              required
            />

            <Select
              label='Select Program'
              placeholder='Choose a program'
              data={programOptions}
              value={selectedProgramId}
              onChange={setSelectedProgramId}
              disabled={!selectedSchoolId || programsLoading}
              searchable
              required
            />

            <Select
              label='Select Term'
              placeholder='Choose a term'
              data={termOptions}
              value={selectedTermName}
              onChange={setSelectedTermName}
              disabled={!currentTerm}
              required
            />
          </Stack>
        </CardSection>
        <CardSection inheritPadding py='md'>
          <Group>
            <Button
              fullWidth
              onClick={() => generateReportMutation.mutate()}
              disabled={
                !selectedSchoolId ||
                !selectedProgramId ||
                !selectedTermName ||
                generateReportMutation.isPending ||
                isDownloading
              }
              leftSection={
                generateReportMutation.isPending || isDownloading ? (
                  <Loader size='sm' />
                ) : null
              }
            >
              {generateReportMutation.isPending || isDownloading
                ? 'Generating Report...'
                : 'Generate Statement of Results Report'}
            </Button>
          </Group>
        </CardSection>
      </Card>
    </Stack>
  );
}
