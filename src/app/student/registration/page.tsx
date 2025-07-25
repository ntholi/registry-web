import { auth } from '@/auth';
import { formatDate, formatDateTime, formatSemester } from '@/lib/utils';
import { getStudentRegistrationHistory } from '@/server/registration-requests/actions';
import {
  Card,
  Text,
  Badge,
  Stack,
  Group,
  Container,
  Title,
  ActionIcon,
  Box,
  Divider,
  SimpleGrid,
  ThemeIcon,
  Flex,
  CardSection,
} from '@mantine/core';
import {
  IconChevronRight,
  IconFileText,
  IconCalendar,
  IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';
import { forbidden } from 'next/navigation';

export default async function page() {
  const session = await auth();

  if (!session?.user?.stdNo) {
    return forbidden();
  }

  const registrationHistory = await getStudentRegistrationHistory(
    session.user.stdNo
  );

  return (
    <Container size='md'>
      <Stack gap='xl'>
        <Box>
          <Title order={1} size='h2' fw={600} mb='xs'>
            Registration History
          </Title>
          <Text c='dimmed' size='sm'>
            View and track all your registration requests and their current
            status
          </Text>
        </Box>

        <Divider />

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {registrationHistory.map((request) => (
            <Card
              withBorder
              key={request.id}
              component={Link}
              href={`/student/registration/${request.id}`}
            >
              <CardSection p='xs'>
                <Flex gap='xs' align='center' justify='space-between'>
                  <Group>
                    <ThemeIcon variant='light' color='gray'>
                      <IconCalendar size={'1rem'} />
                    </ThemeIcon>
                    <Text fw={600} size='lg'>
                      {request.term.name}
                    </Text>
                  </Group>
                  <Badge
                    color={getStatusColor(request.status)}
                    variant='light'
                    size='sm'
                  >
                    {request.status}
                  </Badge>
                </Flex>
              </CardSection>

              <Box mt='xs'>
                <Text size='sm'>{formatSemester(request.semesterNumber)}</Text>
                <Group gap='xs' align='center'>
                  <IconUsers size={14} />
                  <Text size='sm' c='dimmed'>
                    {request.requestedModulesCount} modules
                  </Text>
                </Group>
              </Box>

              <CardSection px='xs' py='xs' withBorder>
                <Flex gap='xs' align='center' justify='space-between'>
                  <Text size='xs' c='dimmed' mt='xs'>
                    Submitted: {formatDateTime(request.createdAt)}
                  </Text>
                  <Group>
                    <Text size='xs' c='dimmed' fw={500}>
                      View Details
                    </Text>
                    <ActionIcon variant='subtle' color='gray' size='sm'>
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Group>
                </Flex>
              </CardSection>
            </Card>
          ))}

          {registrationHistory.length === 0 && (
            <Card shadow='sm' padding='xl' radius='md' withBorder>
              <Stack align='center' gap='md'>
                <IconFileText
                  size={48}
                  style={{ color: 'var(--mantine-color-gray-4)' }}
                />
                <Stack align='center' gap='xs'>
                  <Text fw={500} size='lg' c='dimmed'>
                    No Registration Requests
                  </Text>
                  <Text size='sm' c='dimmed' ta='center'>
                    You haven't submitted any registration requests yet. Your
                    registration history will appear here once you submit your
                    first request.
                  </Text>
                </Stack>
              </Stack>
            </Card>
          )}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'green';
    case 'registered':
      return 'blue';
    case 'rejected':
      return 'red';
    case 'partial':
      return 'yellow';
    case 'pending':
    default:
      return 'gray';
  }
};
