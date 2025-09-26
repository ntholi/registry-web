'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  Divider,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { getGraduationRequestByStudentNo } from '@/server/graduation/requests/actions';
import { formatDateTime } from '@/lib/utils';

type GraduationViewProps = {
  stdNo: string;
  isActive: boolean;
};

export default function GraduationView({
  stdNo,
  isActive,
}: GraduationViewProps) {
  const {
    data: graduationRequest,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['graduationRequest', stdNo],
    queryFn: () => getGraduationRequestByStudentNo(Number(stdNo)),
    enabled: isActive,
  });

  if (isLoading) {
    return <GraduationRequestLoader />;
  }

  if (error) {
    return (
      <Alert color='red' title='Error'>
        Failed to load graduation request. Please try again.
      </Alert>
    );
  }

  if (!graduationRequest) {
    return (
      <Stack align='center' py='xl' gap='md'>
        <Text size='lg' fw={500} c='dimmed'>
          No graduation request found
        </Text>
        <Text size='sm' c='dimmed' ta='center'>
          This student has not submitted a graduation request yet.
        </Text>
      </Stack>
    );
  }

  // Determine status from clearances
  function getGraduationStatus() {
    if (!graduationRequest) return 'pending';
    const clearances = graduationRequest.graduationClearances || [];

    if (clearances.length === 0) return 'pending';

    const hasRejected = clearances.some(
      (gc) => gc.clearance.status === 'rejected'
    );
    if (hasRejected) return 'rejected';

    const allApproved = clearances.every(
      (gc) => gc.clearance.status === 'approved'
    );
    if (allApproved) return 'approved';

    return 'pending';
  }

  const status = getGraduationStatus();

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'approved':
        return <IconCheck size='1rem' />;
      case 'rejected':
        return <IconX size='1rem' />;
      case 'pending':
        return <IconClock size='1rem' />;
      default:
        return <IconClock size='1rem' />;
    }
  }

  return (
    <Stack gap='lg'>
      <Card shadow='sm' padding='lg' radius='md' withBorder>
        <Stack gap='md'>
          <Box>
            <Text size='sm' c='dimmed' mb={4}>
              Date Requested
            </Text>
            <Text>{formatDateTime(graduationRequest.createdAt)}</Text>
          </Box>

          {graduationRequest.message && (
            <Box>
              <Text size='sm' c='dimmed' mb={4}>
                Message
              </Text>
              <Text>{graduationRequest.message}</Text>
            </Box>
          )}

          {graduationRequest.graduationClearances &&
            graduationRequest.graduationClearances.length > 0 && (
              <Box>
                <Text size='sm' c='dimmed' mb={8}>
                  Clearance Status by Department
                </Text>
                <Stack gap='xs'>
                  {graduationRequest.graduationClearances.map((gc) => (
                    <Group key={gc.id} justify='space-between' align='center'>
                      <Text size='sm' tt='capitalize'>
                        {gc.clearance.department}
                      </Text>
                      <Group gap='xs'>
                        {getStatusIcon(gc.clearance.status)}
                        <Text
                          size='sm'
                          c={getStatusColor(gc.clearance.status)}
                          tt='capitalize'
                        >
                          {gc.clearance.status}
                        </Text>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}
        </Stack>
      </Card>

      {status === 'pending' && (
        <Alert
          icon={<IconClock size='1rem' />}
          title='Pending Review'
          color='yellow'
        >
          The graduation request is currently under review by one or more
          departments. You will be notified once all clearances have been
          processed.
        </Alert>
      )}

      {status === 'rejected' && (
        <Alert
          icon={<IconX size='1rem' />}
          title='Request Rejected'
          color='red'
        >
          One or more departments have rejected the graduation clearance. Please
          contact the Registry Office for more information.
        </Alert>
      )}
    </Stack>
  );
}

function GraduationRequestLoader() {
  return (
    <Stack gap='md'>
      <Paper withBorder shadow='sm' p='md'>
        <Stack gap={0} w={'95%'}>
          <Group justify='space-between' align='center'>
            <Skeleton height={16} width={128} />
            <Skeleton height={20} width={64} />
          </Group>
          <Divider my='sm' />
        </Stack>
        <Stack gap={5} mt='sm'>
          <Group>
            <Skeleton height={12} width={80} />
            <Skeleton height={12} width={96} />
          </Group>
          <Group>
            <Skeleton height={12} width={80} />
            <Skeleton height={12} width={128} />
          </Group>
          <Group>
            <Skeleton height={12} width={80} />
            <Skeleton height={12} width={112} />
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
