'use client';

import useUserStudent from '@/hooks/use-user-student';
import {
  Container,
  Title,
  Accordion,
  Text,
  Group,
  Badge,
  Table,
  Stack,
  Paper,
  Loader,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export default function TranscriptsPage() {
  const { student, isLoading } = useUserStudent();

  if (isLoading) {
    return (
      <Container>
        <Group justify='center' mt='xl'>
          <Loader size='lg' />
        </Group>
      </Container>
    );
  }

  if (!student || !student.programs?.length) {
    return (
      <Container>
        <Title order={2} mb='md'>
          Academic Transcripts
        </Title>
        <Alert
          icon={<IconAlertCircle size='1rem' />}
          title='No Academic Records Found'
          color='yellow'
        >
          No academic history available for your account.
        </Alert>
      </Container>
    );
  }

  const activeProgram =
    student.programs.find((p) => p.status === 'Active') || student.programs[0];
  const semesters =
    activeProgram?.semesters
      ?.filter((s) => !['Deleted', 'Deferred', 'DroppedOut'].includes(s.status))
      .sort((a, b) => a.id - b.id) || [];

  return (
    <Container size='lg'>
      <Stack gap='md'>
        <Title order={2}>Academic Transcripts</Title>

        <Paper p='md' withBorder>
          <Group justify='space-between' align='center'>
            <div>
              <Text fw={500}>{student.name}</Text>
              <Text size='sm' c='dimmed'>
                Student No: {student.stdNo}
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text fw={500}>{activeProgram?.structure?.program?.name}</Text>
              <Text size='sm' c='dimmed'>
                Program: {activeProgram?.structure?.code}
              </Text>
            </div>
          </Group>
        </Paper>

        {semesters.length === 0 ? (
          <Alert
            icon={<IconAlertCircle size='1rem' />}
            title='No Semester Records'
            color='blue'
          >
            No semester records found for this program.
          </Alert>
        ) : (
          <Accordion variant='separated'>
            {semesters.map((semester) => {
              const modules =
                semester.studentModules?.filter(
                  (m) => !['Delete', 'Drop'].includes(m.status)
                ) || [];

              return (
                <Accordion.Item
                  key={semester.id}
                  value={semester.id.toString()}
                >
                  <Accordion.Control>
                    <Group justify='space-between'>
                      <div>
                        <Text fw={500}>
                          Semester {semester.semesterNumber || 'N/A'} -{' '}
                          {semester.term}
                        </Text>
                        <Text size='sm' c='dimmed'>
                          {modules.length} module
                          {modules.length !== 1 ? 's' : ''}
                        </Text>
                      </div>
                    </Group>
                  </Accordion.Control>

                  <Accordion.Panel>
                    {modules.length === 0 ? (
                      <Text c='dimmed' ta='center' py='md'>
                        No modules found for this semester
                      </Text>
                    ) : (
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Module Code</Table.Th>
                            <Table.Th>Module Name</Table.Th>
                            <Table.Th>Grade</Table.Th>
                            <Table.Th>Marks</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {modules.map((studentModule) => (
                            <Table.Tr key={studentModule.id}>
                              <Table.Td>
                                <Text fw={500}>
                                  {studentModule.semesterModule?.module?.code ||
                                    'N/A'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text>
                                  {studentModule.semesterModule?.module?.name ||
                                    'N/A'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  color={
                                    ['A+', 'A', 'A-', 'B+', 'B'].includes(
                                      studentModule.grade
                                    )
                                      ? 'green'
                                      : ['B-', 'C+', 'C'].includes(
                                            studentModule.grade
                                          )
                                        ? 'yellow'
                                        : 'red'
                                  }
                                  variant='light'
                                >
                                  {studentModule.grade}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text>{studentModule.marks}</Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}
      </Stack>
    </Container>
  );
}
