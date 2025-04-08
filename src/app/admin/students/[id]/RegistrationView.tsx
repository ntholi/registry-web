'use client';

import { formatDate, formatDateTime, formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Accordion, Anchor, Badge, Group, Stack, Text } from '@mantine/core';
import { format } from 'date-fns';
import Link from 'next/link';

type Props = {
  registrationRequests: NonNullable<
    Awaited<ReturnType<typeof getRegistrationRequest>>
  >[];
};

export default function RegistrationView({ registrationRequests }: Props) {
  return (
    <Accordion
      variant='separated'
      defaultValue={registrationRequests[0]?.id.toString()}
    >
      {registrationRequests.map((request) => (
        <Accordion.Item key={request.id} value={request.id.toString()}>
          <Accordion.Control>
            <Group justify='space-between' align='center' pr={'sm'}>
              <Text>{request.term.name}</Text>
              <Badge
                size='xs'
                variant='light'
                color={
                  request.status === 'approved'
                    ? 'green'
                    : request.status === 'rejected'
                      ? 'red'
                      : request.status === 'registered'
                        ? 'blue'
                        : 'yellow'
                }
              >
                {request.status.toUpperCase()}
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap={5}>
              <Group>
                <Text fw={500} w={150}>
                  Semester
                </Text>
                <Text size='sm'>{formatSemester(request.semesterNumber)}</Text>
              </Group>
              <Group>
                <Text fw={500} w={150}>
                  Date Requested
                </Text>
                <Text size='sm'>{formatDateTime(request.createdAt)}</Text>
              </Group>
              <Group>
                <Text fw={500} w={150}>
                  Modules
                </Text>
                <Anchor
                  size='sm'
                  component={Link}
                  href={`/admin/registration-requests/${request.status}/${request.id}`}
                  className='text-blue-500 hover:underline'
                >
                  {request.requestedModules.length} modules
                </Anchor>
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
