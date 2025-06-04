'use client';

import { useCurrentTerm } from '@/hooks/use-current-term';
import { formatDateTime, formatSemester } from '@/lib/utils';
import { getRegistrationRequestsByStudent } from '@/server/registration-requests/actions';
import {
  Accordion,
  Anchor,
  Badge,
  Divider,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import Link from 'next/link';

type Props = {
  registrationRequests: Awaited<
    ReturnType<typeof getRegistrationRequestsByStudent>
  >;
};

export default function RegistrationView({ registrationRequests }: Props) {
  const { currentTerm } = useCurrentTerm();
  if (registrationRequests.length === 0) {
    return (
      <Stack align='center' py='xl' gap='md'>
        <Text size='lg' fw={500} c='dimmed'>
          No registration for {currentTerm?.name}
        </Text>
        <Text size='sm' c='dimmed' ta='center'>
          This student has not submitted any registration requests yet.
        </Text>
      </Stack>
    );
  }

  return (
    <Accordion
      variant='separated'
      defaultValue={registrationRequests[0]?.id.toString()}
    >
      {registrationRequests.map((request) => (
        <Accordion.Item key={request.id} value={request.id.toString()}>
          <Accordion.Control>
            <Stack gap={0} w={'95%'}>
              <Group justify='space-between' align='center'>
                <Text fw={500} size='sm'>
                  {request.term.name}
                </Text>
                <Badge
                  size='xs'
                  radius={'xs'}
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
              <Divider my='sm' />
            </Stack>
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
