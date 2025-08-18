'use client';
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@mantine/hooks';
import {
  generateFullRegistrationReport,
  generateSummaryRegistrationReport,
  getAvailableTermsForReport,
  getRegistrationDataPreview,
} from '@/server/reports/registration/actions';
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
  Badge,
  SimpleGrid,
  Table,
  ScrollArea,
  Tabs,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDownload } from '@/hooks/use-download';
import {
  IconFileText,
  IconChartBar,
  IconDownload,
  IconEye,
  IconUsers,
  IconBuilding,
} from '@tabler/icons-react';
import RegistrationStats from './RegistrationStats';
import ProgramBreakdownTable from './ProgramBreakdownTable';

export default function Body() {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { downloadFromBase64 } = useDownload({
    onSuccess: (filename) => {
      notifications.show({
        title: 'Success',
        message: `${filename} downloaded successfully`,
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Download Error',
        message: error.message,
        color: 'red',
      });
    },
  });

  const { data: terms, isLoading: termsLoading } = useQuery({
    queryKey: ['available-terms-reports'],
    queryFn: async () => {
      const result = await getAvailableTermsForReport();
      return result.success ? result.data : [];
    },
  });

  const { data: registrationData, isLoading: previewLoading } = useQuery({
    queryKey: ['registration-data-preview', selectedTermId],
    queryFn: async () => {
      if (!selectedTermId) return null;
      const result = await getRegistrationDataPreview(parseInt(selectedTermId));
      return result.success ? result.data : null;
    },
    enabled: !!selectedTermId,
  });

  const termOptions = useMemo(() => {
    return (
      terms?.map((term) => ({
        value: term.id.toString(),
        label: term.name,
      })) || []
    );
  }, [terms]);

  const generateFullReportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTermId) {
        throw new Error('Please select a term');
      }

      const result = await generateFullRegistrationReport(
        parseInt(selectedTermId)
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate full report');
      }
      return result.data;
    },
    onSuccess: (base64Data) => {
      if (!base64Data) {
        throw new Error('No data received from server');
      }
      const selectedTerm = terms?.find(
        (t) => t.id.toString() === selectedTermId
      );
      const filename = `Full_Registration_Report_${selectedTerm?.name || 'Term'}_${new Date().toISOString().split('T')[0]}.docx`;
      downloadFromBase64(base64Data, filename);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: `Error generating full registration report: ${error.message}`,
        color: 'red',
      });
    },
  });

  const generateSummaryReportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTermId) {
        throw new Error('Please select a term');
      }

      const result = await generateSummaryRegistrationReport(
        parseInt(selectedTermId)
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate summary report');
      }
      return result.data;
    },
    onSuccess: (base64Data) => {
      if (!base64Data) {
        throw new Error('No data received from server');
      }
      const selectedTerm = terms?.find(
        (t) => t.id.toString() === selectedTermId
      );
      const filename = `Summary_Registration_Report_${selectedTerm?.name || 'Term'}_${new Date().toISOString().split('T')[0]}.docx`;
      downloadFromBase64(base64Data, filename);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: `Error generating summary registration report: ${error.message}`,
        color: 'red',
      });
    },
  });

  const canGenerate = !!selectedTermId;
  const selectedTerm = terms?.find((t) => t.id.toString() === selectedTermId);

  return (
    <Stack>
      <Card shadow='md' radius='md' withBorder>
        <CardSection inheritPadding py='md'>
          <Group justify='space-between'>
            <div>
              <Title order={2}>Registration Reports</Title>
              <Text c='dimmed' size='sm'>
                Generate comprehensive registration reports for selected terms
              </Text>
            </div>
            <IconUsers size={32} style={{ opacity: 0.6 }} />
          </Group>
        </CardSection>

        <CardSection inheritPadding pb='md'>
          <Select
            label='Select Term'
            placeholder='Choose a term to generate reports'
            data={termOptions}
            value={selectedTermId}
            onChange={setSelectedTermId}
            disabled={termsLoading}
            leftSection={termsLoading ? <Loader size={16} /> : null}
            searchable
            clearable
            mb='md'
          />

          {selectedTermId && (
            <SimpleGrid cols={{ base: 1, md: 2 }} mt='md'>
              <Card withBorder p='md'>
                <Stack gap='xs'>
                  <Group>
                    <IconFileText
                      size={24}
                      style={{ color: 'var(--mantine-color-blue-6)' }}
                    />
                    <Text fw={500}>Full Registration Report</Text>
                  </Group>
                  <Text size='sm' c='dimmed'>
                    Complete list of all registered students with detailed
                    information including student numbers, names, programs, and
                    semester details.
                  </Text>
                  <Button
                    variant='filled'
                    leftSection={
                      generateFullReportMutation.isPending ? (
                        <Loader size={16} />
                      ) : (
                        <IconDownload size={16} />
                      )
                    }
                    onClick={() => generateFullReportMutation.mutate()}
                    disabled={!canGenerate}
                    loading={generateFullReportMutation.isPending}
                    mt='xs'
                    fullWidth={isMobile}
                  >
                    Generate Full Report
                  </Button>
                </Stack>
              </Card>

              <Card withBorder p='md'>
                <Stack gap='xs'>
                  <Group>
                    <IconChartBar
                      size={24}
                      style={{ color: 'var(--mantine-color-green-6)' }}
                    />
                    <Text fw={500}>Summary Registration Report</Text>
                  </Group>
                  <Text size='sm' c='dimmed'>
                    Statistical overview organized by schools and programs,
                    showing student counts by year level and totals per program
                    and school.
                  </Text>
                  <Button
                    variant='filled'
                    color='green'
                    leftSection={
                      generateSummaryReportMutation.isPending ? (
                        <Loader size={16} />
                      ) : (
                        <IconDownload size={16} />
                      )
                    }
                    onClick={() => generateSummaryReportMutation.mutate()}
                    disabled={!canGenerate}
                    loading={generateSummaryReportMutation.isPending}
                    mt='xs'
                    fullWidth={isMobile}
                  >
                    Generate Summary Report
                  </Button>
                </Stack>
              </Card>
            </SimpleGrid>
          )}
        </CardSection>
      </Card>

      {selectedTermId && registrationData && (
        <Card shadow='md' radius='md' withBorder mt='md'>
          <CardSection inheritPadding py='md'>
            <Group>
              <IconEye size={24} />
              <div>
                <Title order={3}>Registration Data Preview</Title>
                <Text c='dimmed' size='sm'>
                  Overview of registration data for {selectedTerm?.name}
                </Text>
              </div>
            </Group>
          </CardSection>

          <CardSection inheritPadding pb='md'>
            <RegistrationStats
              totalStudents={registrationData.fullData.totalStudents}
              totalSchools={registrationData.summaryData.schools.length}
              totalPrograms={registrationData.summaryData.schools.reduce(
                (acc, school) => acc + school.programs.length,
                0
              )}
              termName={registrationData.term.name}
            />

            <Tabs defaultValue='summary' mt='md'>
              <Tabs.List>
                <Tabs.Tab
                  value='summary'
                  leftSection={<IconChartBar size={14} />}
                >
                  Summary View
                </Tabs.Tab>
                <Tabs.Tab
                  value='detailed'
                  leftSection={<IconFileText size={14} />}
                >
                  Student List (First 50)
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value='summary' pt='md'>
                <Stack gap='md'>
                  {registrationData.summaryData.schools.map((school, index) => (
                    <ProgramBreakdownTable key={index} school={school} />
                  ))}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value='detailed' pt='md'>
                <ScrollArea type={isMobile ? 'scroll' : 'hover'}>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th miw={80}>Student No.</Table.Th>
                        <Table.Th miw={isMobile ? 120 : 200}>Name</Table.Th>
                        <Table.Th miw={isMobile ? 150 : 250}>Program</Table.Th>
                        <Table.Th ta='center' miw={60}>
                          Semester
                        </Table.Th>
                        <Table.Th miw={isMobile ? 100 : 150}>School</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {registrationData.fullData.students
                        .slice(0, 50)
                        .map((student, index) => (
                          <Table.Tr key={index}>
                            <Table.Td fw={500}>
                              <Text size={isMobile ? 'xs' : 'sm'}>
                                {student.stdNo}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size={isMobile ? 'xs' : 'sm'}>
                                {student.name}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size={isMobile ? 'xs' : 'sm'} c='dimmed'>
                                {student.programName}
                              </Text>
                            </Table.Td>
                            <Table.Td ta='center'>
                              <Badge
                                variant='light'
                                size={isMobile ? 'xs' : 'sm'}
                              >
                                {student.semesterNumber}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size={isMobile ? 'xs' : 'sm'}>
                                {student.schoolName}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                    </Table.Tbody>
                  </Table>
                  {registrationData.fullData.students.length > 50 && (
                    <Text ta='center' size='sm' c='dimmed' mt='md'>
                      Showing first 50 of{' '}
                      {registrationData.fullData.students.length} students.
                      Generate full report to see all students.
                    </Text>
                  )}
                </ScrollArea>
              </Tabs.Panel>
            </Tabs>
          </CardSection>
        </Card>
      )}

      {previewLoading && selectedTermId && (
        <Card shadow='md' radius='md' withBorder mt='md'>
          <CardSection inheritPadding py='xl'>
            <Group justify='center'>
              <Loader size='lg' />
              <Text>Loading registration data...</Text>
            </Group>
          </CardSection>
        </Card>
      )}
    </Stack>
  );
}
