'use client';

import useUserStudent from '@/hooks/use-user-student';
import { formatSemester } from '@/lib/utils';
import {
  Accordion,
  Alert,
  Box,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle } from '@tabler/icons-react';
import DesktopTable from './DesktopTable';
import MobileTable from './MobileTable';
import LoadingSkeleton from './LoadingSkeleton';

export default function TranscriptsPage() {
  const { student, program, isLoading } = useUserStudent();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!student || !program) {
    return (
      <Container size='md'>
        <Stack gap='lg' mt='md'>
          <Title order={1} size={'h3'} ta='left'>
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

  return (
    <Container size='md'>
      <Stack gap='lg' py='md'>
        <Box ta='center'>
          <Title order={1} mb='xs' size={'h3'}>
            Academic Transcripts
          </Title>
          <Text size='sm' c='dimmed'>
            Your complete academic record
          </Text>
        </Box>

        <Paper p='xl' withBorder shadow='sm' mt='lg'>
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
                      <Text size='sm' fw={600}>
                        {semester.term}
                      </Text>
                      <Text size='sm' c='dimmed'>
                        {formatSemester(semester.semesterNumber)}
                      </Text>
                    </Box>
                  </Accordion.Control>

                  <Accordion.Panel>
                    {isMobile ? (
                      <MobileTable modules={modules} />
                    ) : (
                      <DesktopTable modules={modules} />
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
