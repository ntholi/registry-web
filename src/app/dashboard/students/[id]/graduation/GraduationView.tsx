'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { getGraduationRequestByStudentNo } from '@/server/graduation/requests/actions';
import { formatDate } from '@/lib/utils';
import ProofOfClearancePrinter from './ProofOfClearancePrinter';

type GraduationViewProps = {
  stdNo: string;
  isActive: boolean;
};

export default function GraduationView({ stdNo, isActive }: GraduationViewProps) {
  const { data: graduationRequest, isLoading } = useQuery({
    queryKey: ['graduationRequest', stdNo],
    queryFn: () => getGraduationRequestByStudentNo(Number(stdNo)),
    enabled: isActive,
  });

  if (isLoading) {
    return <Text>Loading graduation information...</Text>;
  }

  if (!graduationRequest) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="No Graduation Request" color="blue">
        This student has not submitted a graduation request yet.
      </Alert>
    );
  }

  // Determine status from clearances
  function getGraduationStatus() {
    if (!graduationRequest) return 'pending';
    const clearances = graduationRequest.graduationClearances || [];
    
    if (clearances.length === 0) return 'pending';
    
    const hasRejected = clearances.some(gc => gc.clearance.status === 'rejected');
    if (hasRejected) return 'rejected';
    
    const allApproved = clearances.every(gc => gc.clearance.status === 'approved');
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
        return <IconCheck size="1rem" />;
      case 'rejected':
        return <IconX size="1rem" />;
      case 'pending':
        return <IconClock size="1rem" />;
      default:
        return <IconClock size="1rem" />;
    }
  }

  const isFullyCleared = status === 'approved';

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={3}>Graduation Request</Title>
        {isFullyCleared && (
          <ProofOfClearancePrinter stdNo={stdNo} />
        )}
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500} size="lg">Request Status</Text>
            <Group gap="xs">
              {getStatusIcon(status)}
              <Text 
                c={getStatusColor(status)} 
                fw={500}
                tt="capitalize"
              >
                {status}
              </Text>
            </Group>
          </Group>

          <Box>
            <Text size="sm" c="dimmed" mb={4}>Request Date</Text>
            <Text>{formatDate(graduationRequest.createdAt)}</Text>
          </Box>

          {graduationRequest.message && (
            <Box>
              <Text size="sm" c="dimmed" mb={4}>Message</Text>
              <Text>{graduationRequest.message}</Text>
            </Box>
          )}

          {graduationRequest.graduationClearances && graduationRequest.graduationClearances.length > 0 && (
            <Box>
              <Text size="sm" c="dimmed" mb={8}>Clearance Status by Department</Text>
              <Stack gap="xs">
                {graduationRequest.graduationClearances.map((gc) => (
                  <Group key={gc.id} justify="space-between" align="center">
                    <Text size="sm" tt="capitalize">{gc.clearance.department}</Text>
                    <Group gap="xs">
                      {getStatusIcon(gc.clearance.status)}
                      <Text 
                        size="sm" 
                        c={getStatusColor(gc.clearance.status)}
                        tt="capitalize"
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
        <Alert icon={<IconClock size="1rem" />} title="Pending Review" color="yellow">
          The graduation request is currently under review by one or more departments. You will be notified once all clearances have been processed.
        </Alert>
      )}

      {status === 'rejected' && (
        <Alert icon={<IconX size="1rem" />} title="Request Rejected" color="red">
          One or more departments have rejected the graduation clearance. Please contact the Registry Office for more information.
        </Alert>
      )}

      {isFullyCleared && (
        <Alert icon={<IconCheck size="1rem" />} title="Cleared for Graduation" color="green">
          This student has been fully cleared for graduation by all departments. All requirements have been met and the proof of clearance document is available for printing.
        </Alert>
      )}
    </Stack>
  );
}