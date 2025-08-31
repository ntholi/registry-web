'use client';

import { formatDateTime, toTitleCase } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
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
  IconX,
} from '@tabler/icons-react';
import {
  getOverallClearanceStatus,
  getStatusColor,
  getStatusIcon,
} from '../utils';

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
          <Badge
            size='sm'
            pos='absolute'
            right={0}
            top={5}
            color={getStatusColor(overallStatus)}
            variant='light'
            leftSection={getStatusIcon(overallStatus)}
          >
            {toTitleCase(overallStatus)}
          </Badge>
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
                        <Paper
                          withBorder
                          bg='var(--mantine-color-gray-light)'
                          p='xs'
                        >
                          <Text size='sm'>{clearance?.message}</Text>
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
              Congratulations! All clearances have been approved.
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
