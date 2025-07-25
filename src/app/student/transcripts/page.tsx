'use client';

import useUserStudent from '@/hooks/use-user-student';
import { formatSemester } from '@/lib/utils';
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconBookmark, IconTrophy } from '@tabler/icons-react';

export default function TranscriptsPage() {
  const { student, program, isLoading } = useUserStudent();

  if (isLoading) {
    return (
      <Container>
        <Center mt='xl'>
          <Loader size='lg' />
        </Center>
      </Container>
    );
  }

  if (!student || !program) {
    return (
      <Container size='md'>
        <Stack gap='lg' mt='md'>
          <Title order={1} ta='center'>
            Academic Transcripts
          </Title>
          <Alert
            icon={<IconAlertCircle size='1.2rem' />}
            title='No Academic Records Found'
            color='yellow'
            radius='md'
          >
            No academic history available for your account.
          </Alert>
        </Stack>
      </Container>
    );
  }

  const getGradeColor = (grade: string) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'green';
    if (['B+', 'B', 'B-'].includes(grade)) return 'blue';
    if (['C+', 'C', 'C-'].includes(grade)) return 'yellow';
    return 'red';
  };

  return (
    <Container size='lg'>
      <Stack gap='xl' py='md'>
        <Box ta='center'>
          <Title order={1} mb='xs'>
            Academic Transcripts
          </Title>
          <Text size='sm' c='dimmed'>
            Your complete academic record
          </Text>
        </Box>

        <Paper radius='lg' p='xl' withBorder shadow='sm'>
          <Group justify='space-between' align='flex-start' wrap='wrap'>
            <Box>
              <Text size='lg' fw={600}>
                {student.name}
              </Text>
              <Text size='xs'>{student.stdNo}</Text>
            </Box>
            <Box ta={{ base: 'left', sm: 'right' }}>
              <Text size='lg' fw={500}>
                {program?.structure?.program?.name}
              </Text>
              <Text size='xs'>{program.schoolName}</Text>
            </Box>
          </Group>
        </Paper>

        {program?.semesters?.length === 0 ? (
          <Alert
            icon={<IconAlertCircle size='1.2rem' />}
            title='No Semester Records'
            color='blue'
            radius='md'
          >
            No semester records found for this program.
          </Alert>
        ) : (
          <Accordion variant='separated' radius='md'>
            {program?.semesters?.map((semester) => {
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
                    <Box>
                      <Text fw={600}>
                        {formatSemester(semester.semesterNumber)}
                      </Text>
                      <Text size='sm' c='dimmed'>
                        {semester.term}
                      </Text>
                    </Box>
                  </Accordion.Control>

                  <Accordion.Panel>
                    {modules.length === 0 ? (
                      <Center py='xl'>
                        <Stack align='center' gap='sm'>
                          <IconBookmark
                            size='3rem'
                            color='var(--mantine-color-dimmed)'
                          />
                          <Text c='dimmed' size='lg'>
                            No modules found for this semester
                          </Text>
                        </Stack>
                      </Center>
                    ) : (
                      <SimpleGrid
                        cols={{ base: 1, sm: 2, lg: 3 }}
                        spacing='md'
                        mt='md'
                      >
                        {modules.map((studentModule) => (
                          <Card
                            key={studentModule.id}
                            shadow='sm'
                            padding='lg'
                            radius='md'
                            withBorder
                          >
                            <Stack gap='sm'>
                              <Group justify='space-between' align='flex-start'>
                                <Stack gap='xs'>
                                  <Text
                                    size='sm'
                                    fw={600}
                                    style={{ lineHeight: 1.2 }}
                                  >
                                    {studentModule.semesterModule?.module
                                      ?.code || 'N/A'}
                                  </Text>

                                  <Text size='xs'>
                                    {studentModule.semesterModule?.module
                                      ?.name || 'N/A'}
                                  </Text>
                                </Stack>
                                <Badge
                                  size='lg'
                                  color={getGradeColor(studentModule.grade)}
                                  variant='light'
                                  radius='md'
                                >
                                  {studentModule.grade}
                                </Badge>
                              </Group>

                              <Divider />

                              <Group justify='space-between' align='center'>
                                <Text size='sm' c='dimmed' fw={500}>
                                  Marks
                                </Text>
                                <Badge variant='light' color='gray' radius='md'>
                                  {studentModule.marks}
                                </Badge>
                              </Group>
                            </Stack>
                          </Card>
                        ))}
                      </SimpleGrid>
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
