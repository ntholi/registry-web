'use client';

import { getBlockedStudentByStdNo } from '@/server/blocked-students/actions';
import { getGraduationRequestByStudentNo } from '@/server/graduation-requests/actions';
import useUserStudent from '@/hooks/use-user-student';
import {
  Alert,
  Button,
  Card,
  Stack,
  Text,
  ThemeIcon,
  Skeleton,
} from '@mantine/core';
import { IconInfoCircle, IconPlus, IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function NewGraduationCard() {
  const { student, isLoading: studentLoading } = useUserStudent();

  const shouldFetchData = !!student?.stdNo;

  const { data: graduationRequest, isLoading: graduationLoading } = useQuery({
    queryKey: ['graduation-request', student?.stdNo],
    queryFn: () => getGraduationRequestByStudentNo(student!.stdNo),
    enabled: shouldFetchData,
  });

  const { data: blockedStudent, isLoading: blockedLoading } = useQuery({
    queryKey: ['blocked-student', student?.stdNo],
    queryFn: () => getBlockedStudentByStdNo(student!.stdNo),
    enabled: shouldFetchData,
  });

  const isLoading = studentLoading || graduationLoading || blockedLoading;

  if (isLoading) {
    return (
      <Card withBorder>
        <Stack align='center' gap='md'>
          <Skeleton height={60} width={60} radius='md' />
          <Stack align='center' gap='xs' w='100%'>
            <Skeleton height={24} width={200} />
            <Skeleton height={16} width={300} />
            <Skeleton height={16} width={250} />
          </Stack>
          <Skeleton height={36} width={150} radius='md' />
        </Stack>
      </Card>
    );
  }

  const hasExistingRequest = !!graduationRequest;
  const isBlocked = blockedStudent && blockedStudent.status === 'blocked';

  if (hasExistingRequest) {
    return null;
  }

  if (isBlocked) {
    return (
      <Alert
        icon={<IconInfoCircle size='1rem' />}
        title='Graduation Request Blocked'
        color='red'
        mb='xl'
      >
        Your account has been blocked from submitting graduation requests.
        Please contact the {blockedStudent.byDepartment} office for assistance.
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
        <ThemeIcon variant='light' color='violet' size='xl'>
          <IconSchool size={'1.5rem'} />
        </ThemeIcon>
        <Stack align='center' gap='xs'>
          <Text fw={500} size='lg'>
            Request Graduation
          </Text>
          <Text size='sm' c='dimmed' ta='center'>
            You haven&apos;t submitted a graduation request yet. Click below to
            start your graduation application process.
          </Text>
        </Stack>
        <Button
          component={Link}
          href='/student/graduation/new'
          color='violet'
          leftSection={<IconPlus size='1rem' />}
        >
          New Graduation Request
        </Button>
      </Stack>
    </Card>
  );
}
