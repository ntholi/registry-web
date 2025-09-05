'use client';

import { getCleanedSemesters } from '@/app/dashboard/students/[id]/AcademicsView/statements/utils';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';
import { formatSemester } from '@/lib/utils';
import { getBlockedStudentByStdNo } from '@/server/blocked-students/actions';
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
import { IconAlertCircle, IconLock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import DesktopTable from './DesktopTable';
import LoadingSkeleton from './LoadingSkeleton';
import MobileTable from './MobileTable';
import TranscriptDownloadButton from './TranscriptDownloadButton';

export default function TranscriptsPage() {
  const { student, program, isLoading } = useUserStudent();
  const { currentTerm } = useCurrentTerm();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data: blockedStudent, isLoading: blockedLoading } = useQuery({
    queryKey: ['blocked-student', student?.stdNo],
    queryFn: async () => {
      if (!student?.stdNo) return null;
      return await getBlockedStudentByStdNo(student.stdNo);
    },
    enabled: !!student?.stdNo,
  });

  if (isLoading || blockedLoading) {
    return <LoadingSkeleton />;
  }

  if (blockedStudent && blockedStudent.status === 'blocked') {
    return (
      <Container size='md'>
        <Stack gap='lg'>
          <Title order={1} size={'h3'} ta='left'>
            Academic Transcripts
          </Title>
          <Alert
            icon={<IconLock size='1.2rem' />}
            title='Access Blocked'
            color='red'
            radius='md'
          >
            Your access to academic transcripts has been blocked. Please contact
            the {blockedStudent.byDepartment} office for assistance.
            <Text fw={500} mt='xs'>
              Reason: {blockedStudent.reason}
            </Text>
          </Alert>
        </Stack>
      </Container>
    );
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

  const semesters = getCleanedSemesters(program).filter(
    (it) => it.term !== currentTerm?.name
  );

  return (
    <Container size='md'>
      <Stack gap='lg' py='md'>
        <Group justify='space-between'>
          <Box>
            <Title order={1} size={'h3'}>
              Academic Transcripts
            </Title>
            <Text size='sm' c='dimmed'>
              Your complete academic record
            </Text>
          </Box>
          <TranscriptDownloadButton
            stdNo={student.stdNo}
            studentName={student.name}
            disabled={!semesters.length}
          />
        </Group>

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

        {semesters.length === 0 ? (
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
