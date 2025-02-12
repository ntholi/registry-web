'use client';

import { Accordion, Badge, Group, Stack, Text } from '@mantine/core';
import { DashboardUser } from '@/db/schema';
import { registrationClearances } from '@/db/schema';
import type { RegistrationRequest } from '@/types/registration-request';
import { format } from 'date-fns';

interface Props {
  value: RegistrationRequest;
}

const departments: DashboardUser[] = ['finance', 'library', 'resource'];

const getStatusColor = (status: typeof registrationClearances.$inferSelect.status) => {
  switch (status) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'yellow';
  }
};

const formatDate = (date: number | null) => {
  if (!date) return 'Not yet responded';
  return format(new Date(date * 1000), 'dd MMM yyyy HH:mm');
};

export default function ClearanceAccordion({ value }: Props): JSX.Element {
  return (
    <Accordion variant="contained">
      {departments.map((dept) => {
        const clearance = value.clearances?.find((c) => c.department === dept);
        return (
          <Accordion.Item key={dept} value={dept}>
            <Accordion.Control>
              <Group justify="space-between">
                <Text transform="capitalize">{dept} Department</Text>
                {clearance && (
                  <Badge color={getStatusColor(clearance.status)}>
                    {clearance.status}
                  </Badge>
                )}
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Group>
                  <Text fw={500}>Status:</Text>
                  <Text>
                    {clearance?.status || 'Pending'}
                  </Text>
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
                  <Text>
                    {clearance?.respondedBy || 'Not yet responded'}
                  </Text>
                </Group>
                <Group>
                  <Text fw={500}>Message:</Text>
                  <Text>
                    {clearance?.message || 'No message'}
                  </Text>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
