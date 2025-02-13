'use client';

import { DashboardUser, registrationRequestStatusEnum } from '@/db/schema';
import { formatDate, toTitleCase } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Accordion, Badge, Group, Stack, Text } from '@mantine/core';

interface Props {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
}

type Status = (typeof registrationRequestStatusEnum)[number];

const departments: DashboardUser[] = ['finance', 'library', 'resource'];

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

export default function ClearanceAccordion({ value }: Props) {
  return (
    <Accordion variant='contained'>
      {departments.map((dept) => {
        const clearance = value.clearances?.find((c) => c.department === dept);
        return (
          <Accordion.Item key={dept} value={dept}>
            <Accordion.Control>
              <Group justify='space-between'>
                <Text>{toTitleCase(dept)}</Text>
                {clearance && (
                  <Badge color={getStatusColor(clearance.status)}>
                    {clearance.status}
                  </Badge>
                )}
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap='xs'>
                <Group>
                  <Text fw={500}>Status:</Text>
                  <Text>{clearance?.status || 'Pending'}</Text>
                </Group>
                <Group>
                  <Text fw={500}>Response Date:</Text>
                  <Text>
                    {clearance?.responseDate
                      ? formatDate(clearance.responseDate)
                      : 'Not yet responded'}
                  </Text>
                </Group>
                <Group>
                  <Text fw={500}>Responded By:</Text>
                  <Text>{clearance?.respondedBy || 'Not yet responded'}</Text>
                </Group>
                <Group>
                  <Text fw={500}>Message:</Text>
                  <Text>{clearance?.message || 'No message'}</Text>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
