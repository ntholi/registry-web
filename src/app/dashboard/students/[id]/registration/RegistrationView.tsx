'use client';

import { registrationRequests } from '@/db/schema';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { formatDateTime, formatSemester } from '@/lib/utils';
import { getStudentRegistrationHistory } from '@/server/registration-requests/actions';
import {
  Accordion,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import RegistrationModal from './RegistrationModal';

type StudentRegistrationHistory = {
  id: number;
  status: (typeof registrationRequests.$inferSelect)['status'];
  semesterNumber: number;
  createdAt: Date | null;
  term: {
    id: number;
    name: string;
  };
  requestedModulesCount: number;
};

type Props = {
  stdNo: number;
  isActive?: boolean;
};

export default function RegistrationView({ stdNo, isActive = true }: Props) {
  const { currentTerm } = useCurrentTerm();
  const [opened, { open, close }] = useDisclosure(false);

  const {
    data: registrationRequests,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['registrationRequests', stdNo],
    queryFn: () => getStudentRegistrationHistory(stdNo),
    enabled: isActive,
  });

  if (isLoading) {
    return <RegistrationRequestsLoader />;
  }

  if (error) {
    return (
      <Alert color='red' title='Error'>
        Failed to load registration requests. Please try again.
      </Alert>
    );
  }

  const hasCurrentTermRegistration = registrationRequests?.some(
    (request) => request.term.id === currentTerm?.id
  );

  if (!registrationRequests || registrationRequests.length === 0) {
    return (
      <>
        <Stack align='center' py='xl' gap='md'>
          <Text size='lg' fw={500} c='dimmed'>
            No registration requests found
          </Text>
          <Text size='sm' c='dimmed' ta='center'>
            This student has not submitted any registration requests yet.
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            variant='filled'
            color='blue'
            onClick={open}
          >
            Create New Registration Request
          </Button>
        </Stack>

        <RegistrationModal opened={opened} onClose={close} stdNo={stdNo} />
      </>
    );
  }

  return (
    <>
      <Stack gap='md'>
        {!hasCurrentTermRegistration && currentTerm && (
          <Card withBorder p='md'>
            <Group justify='space-between' align='center'>
              <Stack gap={4}>
                <Text size='sm' fw={500}>
                  No registration for {currentTerm.name}
                </Text>
                <Text size='xs' c='dimmed'>
                  Create a registration request for this student
                </Text>
              </Stack>
              <Button
                leftSection={<IconPlus size={14} />}
                variant='filled'
                size='sm'
                color='blue'
                onClick={open}
              >
                Create
              </Button>
            </Group>
          </Card>
        )}

        <Accordion
          variant='separated'
          defaultValue={registrationRequests[0]?.id.toString()}
        >
          {registrationRequests.map((request: StudentRegistrationHistory) => (
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
                    <Text size='sm'>
                      {formatSemester(request.semesterNumber)}
                    </Text>
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
                      href={`/dashboard/registration-requests/${request.status}/${request.id}`}
                      className='text-blue-500 hover:underline'
                    >
                      {request.requestedModulesCount} modules
                    </Anchor>
                  </Group>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>

      <RegistrationModal opened={opened} onClose={close} stdNo={stdNo} />
    </>
  );
}

function RegistrationRequestsLoader() {
  return (
    <Stack gap='md'>
      {[1, 2, 3].map((index) => (
        <Paper key={index} withBorder shadow='sm' p='md'>
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
      ))}
    </Stack>
  );
}
