'use client';

import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  Card,
  Stack,
  Text,
  Badge,
  Title,
  Group,
  ThemeIcon,
  Alert,
  Timeline,
  TimelineItem,
  Divider,
  Paper,
  Box,
} from '@mantine/core';
import {
  IconCheck,
  IconClock,
  IconX,
  IconInfoCircle,
  IconBuildingBank,
  IconBooks,
} from '@tabler/icons-react';
import { formatDateTime, toTitleCase } from '@/lib/utils';

type Props = {
  registration: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

type Status = 'pending' | 'approved' | 'rejected';

export default function ClearanceStatusView({ registration }: Props) {
  const { clearances = [] } = registration;

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'finance':
        return <IconBuildingBank size='1rem' />;
      case 'library':
        return <IconBooks size='1rem' />;
      default:
        return <IconInfoCircle size='1rem' />;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'yellow';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'approved':
        return <IconCheck size='1rem' />;
      case 'rejected':
        return <IconX size='1rem' />;
      default:
        return <IconClock size='1rem' />;
    }
  };

  const getOverallStatus = () => {
    if (clearances.length === 0) return 'pending';

    const allApproved = clearances.every((c) => c.status === 'approved');
    const anyRejected = clearances.some((c) => c.status === 'rejected');

    if (allApproved) return 'approved';
    if (anyRejected) return 'rejected';
    return 'pending';
  };

  const overallStatus = getOverallStatus();
  const departments = ['finance', 'library'];

  return (
    <Card withBorder p='md' radius='md'>
      <Stack gap='md'>
        <Group justify='space-between' align='flex-start' wrap='wrap'>
          <div>
            <Title order={2} size='h3' fw={600}>
              Clearance Status
            </Title>
            <Text size='sm' c='dimmed'>
              Requires approval from multiple departments
            </Text>
          </div>
          <Badge
            size='lg'
            color={getStatusColor(overallStatus)}
            variant='light'
            leftSection={getStatusIcon(overallStatus)}
          >
            {toTitleCase(overallStatus)}
          </Badge>
        </Group>

        <Divider />

        {clearances.length === 0 ? (
          <Alert
            icon={<IconInfoCircle size='1rem' />}
            color='blue'
            variant='light'
          >
            <Text size='sm'>
              Clearance requests are being prepared. You will see the status
              here once departments begin processing your request.
            </Text>
          </Alert>
        ) : (
          <Timeline active={clearances.length} bulletSize={20} lineWidth={2}>
            {departments.map((dept) => {
              const clearance = clearances.find((c) => c.department === dept);
              const status = clearance?.status || 'pending';

              return (
                <TimelineItem
                  key={dept}
                  bullet={
                    <ThemeIcon
                      size={20}
                      color={getStatusColor(status)}
                      variant='light'
                    >
                      {getDepartmentIcon(dept)}
                    </ThemeIcon>
                  }
                  title={
                    <Group justify='space-between' align='center' wrap='wrap'>
                      <Text fw={600} size='md'>
                        {toTitleCase(dept)} Department
                      </Text>
                      <Badge
                        color={getStatusColor(status)}
                        variant='light'
                        size='sm'
                        leftSection={getStatusIcon(status)}
                      >
                        {toTitleCase(status)}
                      </Badge>
                    </Group>
                  }
                >
                  <Stack gap='xs' mt='xs'>
                    {clearance?.responseDate && (
                      <Box>
                        <Text size='xs' c='dimmed' fw={500} tt='uppercase'>
                          Response Date
                        </Text>
                        <Text size='sm'>
                          {formatDateTime(clearance.responseDate)}
                        </Text>
                      </Box>
                    )}

                    {clearance?.respondedBy && (
                      <Box>
                        <Text size='xs' c='dimmed' fw={500} tt='uppercase'>
                          Processed By
                        </Text>
                        <Text size='sm'>{clearance.respondedBy.name}</Text>
                      </Box>
                    )}

                    {clearance?.message && (
                      <Box>
                        <Text
                          size='xs'
                          c='dimmed'
                          fw={500}
                          tt='uppercase'
                          mb={4}
                        >
                          Message
                        </Text>
                        <Paper withBorder bg='gray.0' p='xs'>
                          <Text size='sm'>{clearance.message}</Text>
                        </Paper>
                      </Box>
                    )}

                    {!clearance && (
                      <Text size='sm' c='dimmed' fs='italic'>
                        Waiting for department to process your request...
                      </Text>
                    )}
                  </Stack>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}

        {overallStatus === 'approved' && (
          <Alert icon={<IconCheck size='1rem' />} color='green' variant='light'>
            <Text size='sm' fw={500}>
              🎉 Congratulations! All clearances have been approved. Your
              registration is now complete.
            </Text>
          </Alert>
        )}

        {overallStatus === 'rejected' && (
          <Alert icon={<IconX size='1rem' />} color='red' variant='light'>
            <Text size='sm' fw={500}>
              Your registration has been rejected by one or more departments.
              Please review the messages above and contact the relevant
              departments for assistance.
            </Text>
          </Alert>
        )}

        {overallStatus === 'pending' && clearances.length > 0 && (
          <Alert icon={<IconClock size='1rem' />} color='blue' variant='light'>
            <Text size='sm'>
              Your registration is currently being processed. You will receive
              an email notification once all clearances are complete.
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
