'use client';

import { DashboardUser, registrationRequestStatusEnum } from '@/db/schema';
import { formatDate, formatDateTime, toTitleCase } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  Accordion,
  Anchor,
  Badge,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';
import Link from 'next/link';

interface Props {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
}

type Status = (typeof registrationRequestStatusEnum)[number];

const departments: DashboardUser[] = ['finance', 'library', 'resource'];

export default function ClearanceAccordion({ value }: Props) {
  return (
    <Accordion variant='separated'>
      {departments.map((dept) => {
        const clearance = value.clearances?.find((c) => c.department === dept);
        const status = clearance?.status || 'pending';
        return (
          <Accordion.Item key={dept} value={dept}>
            <Accordion.Control>
              <Group justify='space-between'>
                <Group>
                  <ThemeIcon
                    color={getStatusColor(status)}
                    variant='light'
                    size='lg'
                  >
                    {getStatusIcon(status)}
                  </ThemeIcon>
                  <Text fw={500}>{toTitleCase(dept)}</Text>
                </Group>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap='sm'>
                <Group>
                  <Text c='dimmed' size='sm' w={120}>
                    Status:
                  </Text>
                  <Badge
                    size='sm'
                    color={getStatusColor(status)}
                    variant='light'
                  >
                    {toTitleCase(status)}
                  </Badge>
                </Group>
                <Group>
                  <Text c='dimmed' size='sm' w={120}>
                    Response Date:
                  </Text>
                  <Text>
                    {clearance?.responseDate
                      ? formatDateTime(clearance.responseDate)
                      : '-'}
                  </Text>
                </Group>
                <Group>
                  <Text c='dimmed' size='sm' w={120}>
                    Responded By:
                  </Text>
                  {clearance?.respondedBy ? (
                    <Anchor
                      size='sm'
                      href={`/admin/users/${clearance?.respondedBy?.id}`}
                      component={Link}
                    >
                      {clearance?.respondedBy?.name}{' '}
                    </Anchor>
                  ) : (
                    <Text size='sm'>{'-'}</Text>
                  )}
                </Group>
                <Group align='flex-start'>
                  <Text c='dimmed' size='sm' w={120}>
                    Message:
                  </Text>
                  <Text>{clearance?.message || '-'}</Text>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

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
