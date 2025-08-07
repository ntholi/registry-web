import { getBlockedStudentByStdNo } from '@/server/blocked-students/actions';
import { getStudentRegistrationHistory } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { Alert, Button, Card, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

interface NewRegistrationCardProps {
  stdNo: number;
}

export default async function NewRegistrationCard({
  stdNo,
}: NewRegistrationCardProps) {
  const [currentTerm, registrationHistory, blockedStudent] = await Promise.all([
    getCurrentTerm(),
    getStudentRegistrationHistory(stdNo),
    getBlockedStudentByStdNo(stdNo),
  ]);

  const hasCurrentRegistration = registrationHistory.some(
    (request) => request.term.id === currentTerm.id
  );

  const isBlocked = blockedStudent && blockedStudent.status === 'blocked';

  if (hasCurrentRegistration) {
    return null;
  }

  if (isBlocked) {
    return (
      <Alert
        icon={<IconInfoCircle size='1rem' />}
        title='Registration Blocked'
        color='red'
        mb='xl'
      >
        Your account has been blocked from registering. Please contact the{' '}
        {blockedStudent.byDepartment} office for assistance.
        <br />
        <Text fw={500} mt='xs'>
          Reason: {blockedStudent?.reason}
        </Text>
      </Alert>
    );
  }

  return (
    <Card withBorder>
      <Stack align='center' gap='md'>
        <ThemeIcon variant='light' color='gray' size='xl'>
          <IconPlus size={'1.5rem'} />
        </ThemeIcon>
        <Stack align='center' gap='xs'>
          <Text fw={500} size='lg'>
            Start New Registration
          </Text>
          <Text size='sm' c='dimmed' ta='center'>
            You don&apos;t have a registration request for{' '}
            <Text span fw={600}>
              {currentTerm.name}
            </Text>{' '}
            yet. Click below to start your registration process.
          </Text>
        </Stack>
        <Button component={Link} href='/student/registration/new'>
          New Registration
        </Button>
      </Stack>
    </Card>
  );
}
