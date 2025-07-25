import { auth } from '@/auth';
import { formatDateTime, formatSemester } from '@/lib/utils';
import { getStudentRegistrationHistory } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  CardSection,
  Container,
  Divider,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconCalendar,
  IconChevronRight,
  IconFileText,
  IconPlus,
} from '@tabler/icons-react';
import Link from 'next/link';
import { forbidden } from 'next/navigation';
import { getStatusColor } from '../utils/colors';

export default async function page() {
  const session = await auth();
  const currentTerm = await getCurrentTerm();

  if (!session?.user?.stdNo) {
    return forbidden();
  }

  const registrationHistory = await getStudentRegistrationHistory(
    session.user.stdNo
  );

  const hasCurrentRegistration = registrationHistory.some(
    (request) => request.term.id === currentTerm.id
  );

  return (
    <Container size='md'>
      <Stack gap='xl'>
        <Box>
          <Title order={1} size='h2' fw={600} mb='xs'>
            Registration Requests
          </Title>
          <Text c='dimmed' size='sm'>
            View and track all your registration requests and their current
            status
          </Text>
        </Box>

        {!hasCurrentRegistration && (
          <Card withBorder>
            <Stack align='center' gap='md'>
              <ThemeIcon variant='light' color='gray' size='xl'>
                <IconPlus size={'1.5rem'} />
              </ThemeIcon>
              <Stack align='center' gap='xs'>
                <Text fw={500} size='lg'>
                  Start New Registration
                </Text>
                <Text size='sm' c='dimmed' ta='center'>
                  You don&apos;t have a registration request for{' '}
                  <Text span fw={600}>
                    {currentTerm.name}
                  </Text>{' '}
                  yet. Click below to start your registration process.
                </Text>
              </Stack>
              <Button component={Link} href='/student/registration/new'>
                New Registration
              </Button>
            </Stack>
          </Card>
        )}

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
                <Text size='sm' c='dimmed'>
                  {request.requestedModulesCount} modules
                </Text>
              </Box>

              <CardSection px='xs' mt='xs' py='xs' withBorder>
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
                <IconFileText size={48} />
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
