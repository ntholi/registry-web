'use client';
import React, { useState } from 'react';
import {
  Button,
  Title,
  Text,
  Card,
  Group,
  Loader,
  Stack,
  Grid,
  Paper,
  ThemeIcon,
  List,
  Badge,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import {
  IconFileSpreadsheet,
  IconDownload,
  IconInfoCircle,
  IconCheck,
  IconChartBar,
  IconReportAnalytics,
  IconUsers,
  IconLayoutGrid,
} from '@tabler/icons-react';
import { generateBoeReport } from '@/server/reports/boe/actions';
import { notifications } from '@mantine/notifications';

export default function Body() {
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      notifications.show({
        id: 'boe-generating',
        title: 'Generating BOE Report',
        message:
          'Please wait while we generate the report. This may take a few moments...',
        loading: true,
        autoClose: false,
      });

      // Get the report data
      const buffer = await generateBoeReport();

      // Convert buffer to blob
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get current date for filename
      const date = new Date().toISOString().split('T')[0];
      link.download = `FICT_BOE_Report_${date}.xlsx`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notifications.update({
        id: 'boe-generating',
        title: 'Report Generated Successfully',
        message: 'Your BOE Report has been downloaded',
        color: 'green',
        loading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      notifications.update({
        id: 'boe-generating',
        title: 'Error Generating Report',
        message:
          error.message || 'An error occurred while generating the report',
        color: 'red',
        loading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack p='lg'>
      <Title order={2}>Board of Examination (BOE) Reports</Title>
      <Text c='dimmed' size='sm' mb='md'>
        Generate comprehensive Excel reports for the Board of Examination
        showing student performance in the FICT program
      </Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder p='xl' radius='md' shadow='sm'>
            <Stack>
              <Group align='flex-start'>
                <ThemeIcon size='xl' variant='light' color='blue' radius='md'>
                  <IconReportAnalytics size={24} />
                </ThemeIcon>
                <div>
                  <Title order={3}>FICT Program BOE Report</Title>
                  <Text c='dimmed' size='sm' mb='md'>
                    Generate a detailed academic performance report for all
                    students in the Faculty of Information and Communication
                    Technology (FICT) program (ID 151).
                  </Text>
                </div>
              </Group>

              <Divider my='sm' />

              <Stack>
                <Text fw={500} size='md'>
                  Report Contents:
                </Text>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing='md'>
                  <Paper withBorder p='md' radius='md'>
                    <Group mb='xs'>
                      <ThemeIcon
                        size='md'
                        variant='light'
                        color='blue'
                        radius='md'
                      >
                        <IconChartBar size={16} />
                      </ThemeIcon>
                      <Text fw={500}>Summary Information</Text>
                    </Group>
                    <List size='sm' spacing='xs'>
                      <List.Item>Program overview statistics</List.Item>
                      <List.Item>Student distribution by semester</List.Item>
                      <List.Item>Structure statistics</List.Item>
                      <List.Item>Enrollment data visualization</List.Item>
                    </List>
                  </Paper>

                  <Paper withBorder p='md' radius='md'>
                    <Group mb='xs'>
                      <ThemeIcon
                        size='md'
                        variant='light'
                        color='green'
                        radius='md'
                      >
                        <IconUsers size={16} />
                      </ThemeIcon>
                      <Text fw={500}>Detailed Student Data</Text>
                    </Group>
                    <List size='sm' spacing='xs'>
                      <List.Item>Student information by semester</List.Item>
                      <List.Item>Complete module grades</List.Item>
                      <List.Item>Color-coded performance indicators</List.Item>
                      <List.Item>Organized by program structure</List.Item>
                    </List>
                  </Paper>
                </SimpleGrid>

                <Group mt='lg'>
                  <Badge color='blue' size='lg' radius='sm' variant='light'>
                    Excel Format
                  </Badge>
                  <Badge color='green' size='lg' radius='sm' variant='light'>
                    Multiple Worksheets
                  </Badge>
                  <Badge color='yellow' size='lg' radius='sm' variant='light'>
                    Data Visualization
                  </Badge>
                </Group>

                <Button
                  onClick={handleGenerateReport}
                  leftSection={
                    loading ? (
                      <Loader size='xs' />
                    ) : (
                      <IconFileSpreadsheet size={18} />
                    )
                  }
                  rightSection={!loading && <IconDownload size={18} />}
                  disabled={loading}
                  size='lg'
                  mt='md'
                >
                  {loading ? 'Generating Report...' : 'Generate BOE Report'}
                </Button>

                {loading && (
                  <Text size='xs' c='dimmed' ta='center'>
                    This may take a few moments depending on the number of
                    students
                  </Text>
                )}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <Paper withBorder p='lg' radius='md' shadow='sm'>
              <Group mb='md'>
                <ThemeIcon size='lg' variant='light' color='blue' radius='md'>
                  <IconInfoCircle size={20} />
                </ThemeIcon>
                <Title order={4}>About BOE Reports</Title>
              </Group>

              <Text size='sm' mb='md'>
                Board of Examination (BOE) reports provide a comprehensive view
                of student academic performance for program review and quality
                assurance purposes.
              </Text>

              <List
                spacing='xs'
                size='sm'
                center
                icon={
                  <ThemeIcon color='blue' size={20} radius='xl'>
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>Organized by program structure</List.Item>
                <List.Item>Detailed grade distribution</List.Item>
                <List.Item>Semester-wise performance tracking</List.Item>
                <List.Item>Statistical summary</List.Item>
              </List>
            </Paper>

            <Paper withBorder p='lg' radius='md' shadow='sm'>
              <Group mb='md'>
                <ThemeIcon size='lg' variant='light' color='teal' radius='md'>
                  <IconLayoutGrid size={20} />
                </ThemeIcon>
                <Title order={4}>Report Format</Title>
              </Group>

              <Text size='sm' mb='md'>
                The BOE report is generated as an Excel workbook with the
                following structure:
              </Text>

              <List size='sm' spacing='xs' withPadding>
                <List.Item fw={500}>Summary Sheet</List.Item>
                <List.Item icon='•' ml='sm'>
                  Program overview and statistics
                </List.Item>
                <List.Item fw={500} mt='xs'>
                  Structure Sheets
                </List.Item>
                <List.Item icon='•' ml='sm'>
                  One sheet per structure-semester combination
                </List.Item>
                <List.Item icon='•' ml='sm'>
                  Complete student grade data with color coding
                </List.Item>
              </List>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
