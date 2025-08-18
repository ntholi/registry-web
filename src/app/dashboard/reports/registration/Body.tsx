'use client';
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@mantine/hooks';
import {
  generateFullRegistrationReport,
  generateSummaryRegistrationReport,
  getAvailableTermsForReport,
  getRegistrationDataPreview,
  getPaginatedRegistrationStudents,
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
  Table,
  ScrollArea,
  Tabs,
  Pagination as MPagination,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDownload } from '@/hooks/use-download';
import {
  IconTable,
  IconChartBar,
  IconDownload,
  IconUsers,
} from '@tabler/icons-react';
import ProgramBreakdownTable from './ProgramBreakdownTable';
import { formatSemester } from '@/lib/utils';

export default function Body() {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('summary');
  const [currentPage, setCurrentPage] = useState(1);
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

  const { data: paginatedStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ['paginated-registration-students', selectedTermId, currentPage],
    queryFn: async () => {
      if (!selectedTermId) return null;
      const result = await getPaginatedRegistrationStudents(
        parseInt(selectedTermId),
        currentPage,
        20
      );
      return result.success ? result.data : null;
    },
    enabled: !!selectedTermId && activeTab === 'detailed',
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
      const filename = `Full_Registration_Report_${selectedTerm?.name || 'Term'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFromBase64(
        base64Data,
        filename,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
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

  const handleDownload = () => {
    if (activeTab === 'summary') {
      generateSummaryReportMutation.mutate();
    } else {
      generateFullReportMutation.mutate();
    }
  };

  const selectedTerm = terms?.find((t) => t.id.toString() === selectedTermId);
  const isDownloading =
    generateFullReportMutation.isPending ||
    generateSummaryReportMutation.isPending;

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
          <Group align='flex-end' gap='lg'>
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
              style={{ flex: 1 }}
            />

            {registrationData && (
              <div>
                <Text size='sm' c='dimmed' mb={4}>
                  Total Students
                </Text>
                <Group gap='xs'>
                  <IconUsers size={20} />
                  <Text fw={600} size='lg'>
                    {registrationData.fullData.totalStudents.toLocaleString()}
                  </Text>
                </Group>
              </div>
            )}
          </Group>
        </CardSection>
      </Card>

      {selectedTermId && registrationData && (
        <Card shadow='md' radius='md' withBorder mt='md'>
          <CardSection inheritPadding py='md'>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Group justify='space-between' align='flex-end' mb='sm'>
                <Tabs.List>
                  <Tabs.Tab
                    value='summary'
                    leftSection={<IconChartBar size={14} />}
                  >
                    Summary View
                  </Tabs.Tab>
                  <Tabs.Tab
                    value='detailed'
                    leftSection={<IconTable size={14} />}
                  >
                    Student List
                  </Tabs.Tab>
                </Tabs.List>

                <Button
                  leftSection={
                    isDownloading ? (
                      <Loader size={16} />
                    ) : (
                      <IconDownload size={16} />
                    )
                  }
                  onClick={handleDownload}
                  disabled={!selectedTermId}
                  loading={isDownloading}
                  variant='filled'
                  color='blue'
                >
                  Download
                </Button>
              </Group>

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
                      {studentsLoading ? (
                        Array(20)
                          .fill(0)
                          .map((_, index) => (
                            <Table.Tr key={`skeleton-${index}`}>
                              <Table.Td>
                                <Text size={isMobile ? 'xs' : 'sm'}>
                                  Loading...
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size={isMobile ? 'xs' : 'sm'}>
                                  Loading...
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size={isMobile ? 'xs' : 'sm'}>
                                  Loading...
                                </Text>
                              </Table.Td>
                              <Table.Td ta='center'>
                                <Badge
                                  variant='light'
                                  size={isMobile ? 'xs' : 'sm'}
                                >
                                  -
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size={isMobile ? 'xs' : 'sm'}>
                                  Loading...
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : paginatedStudents?.students.length ? (
                        paginatedStudents.students.map((student, index) => (
                          <Table.Tr key={`${student.stdNo}-${index}`}>
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
                                {formatSemester(student.semesterNumber, 'mini')}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size={isMobile ? 'xs' : 'sm'}>
                                {student.schoolName}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={5}>
                            <Text ta='center' size='sm' c='dimmed'>
                              No students found
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>

                  {paginatedStudents && paginatedStudents.totalPages > 1 && (
                    <Group justify='center' mt='md'>
                      <MPagination
                        total={paginatedStudents.totalPages}
                        value={currentPage}
                        onChange={(page) => {
                          setCurrentPage(page);
                        }}
                        size='sm'
                      />
                    </Group>
                  )}

                  {paginatedStudents && (
                    <Text ta='center' size='sm' c='dimmed' mt='md'>
                      Showing {(currentPage - 1) * 20 + 1} to{' '}
                      {Math.min(currentPage * 20, paginatedStudents.totalCount)}{' '}
                      of {paginatedStudents.totalCount} students
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
