'use client';

import { formatDateTime, toTitleCase } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration/requests/actions';
import {
  Alert,
  Badge,
  Box,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Timeline,
  TimelineItem,
  Title,
} from '@mantine/core';
import {
  IconCheck,
  IconClock,
  IconInfoCircle,
  IconExclamationCircle,
} from '@tabler/icons-react';
import {
  getRegistrationOverallClearanceStatus as getOverallClearanceStatus,
  getStatusColor,
  getStatusIcon,
} from '../../utils/status';

type Props = {
  registration: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function ClearanceStatusView({ registration }: Props) {
  const { clearances = [] } = registration;

  const overallStatus = getOverallClearanceStatus(registration);
  const departments = ['finance', 'library'];

  return (
    <Card withBorder p='md' radius='md'>
      <Stack gap='md'>
        <Box pos='relative'>
          <Title order={2} size='h4' fw={600}>
            Clearance Status
          </Title>
        </Box>

        <Divider />

        {clearances.length === 0 ? (
          <Alert
            icon={<IconInfoCircle size='1rem' />}
            color='gray'
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
              const clearanceMapping = clearances.find(
                (c) => c.clearance.department === dept
              );
              const clearance = clearanceMapping?.clearance;
              const status = clearance?.status || 'pending';

              return (
                <TimelineItem
                  key={dept}
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
                        <Text size='xs' c='dimmed' fw={500}>
                          Response Date
                        </Text>
                        <Text size='sm'>
                          {formatDateTime(clearance.responseDate)}
                        </Text>
                      </Box>
                    )}
                    {clearance?.message && (
                      <ClearanceMessage
                        message={clearance.message}
                        status={clearance.status}
                      />
                    )}

                    {clearance?.status === 'pending' && (
                      <Text size='sm' c='dimmed' fs='italic'>
                        Waiting for {toTitleCase(dept)} Department to process
                        your graduation request...
                      </Text>
                    )}
                  </Stack>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </Stack>
    </Card>
  );
}

function ClearanceMessage({
  message,
  status,
}: {
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'partial' | 'registered';
}) {
  const color = getStatusColor(status);

  const title =
    status === 'approved'
      ? 'Note'
      : status === 'rejected'
        ? 'Action required'
        : 'Message';

  return (
    <Box>
      <Text size='xs' c='dimmed' fw={500} mb={4}>
        {title}
      </Text>
      <Alert color={color} variant={'light'} radius='sm'>
        <Text size='sm'>{message}</Text>
      </Alert>
    </Box>
  );
}
