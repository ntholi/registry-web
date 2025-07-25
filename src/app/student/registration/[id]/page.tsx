import { auth } from '@/auth';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Grid,
  GridCol,
  Divider,
  Box,
  Paper,
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  ThemeIcon,
} from '@mantine/core';
import {
  IconCheck,
  IconClock,
  IconX,
  IconBooks,
  IconBuildingBank,
  IconCalendar,
} from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { forbidden } from 'next/navigation';
import ModulesView from './ModulesView';
import ClearanceStatusView from './ClearanceStatusView';
import { formatDateTime, formatSemester } from '@/lib/utils';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function page({ params }: Props) {
  const session = await auth();

  if (!session?.user?.stdNo) {
    return forbidden();
  }

  const { id } = await params;
  const registration = await getRegistrationRequest(Number(id));

  if (!registration) {
    return notFound();
  }

  // Ensure student can only access their own registration
  if (registration.stdNo !== session.user.stdNo) {
    return forbidden();
  }

  const getOverallClearanceStatus = () => {
    if (!registration.clearances || registration.clearances.length === 0) {
      return 'pending';
    }

    const allApproved = registration.clearances.every(
      (c) => c.status === 'approved'
    );
    const anyRejected = registration.clearances.some(
      (c) => c.status === 'rejected'
    );

    if (allApproved) return 'approved';
    if (anyRejected) return 'rejected';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'registered':
        return 'blue';
      default:
        return 'yellow';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <IconCheck size='1rem' />;
      case 'rejected':
        return <IconX size='1rem' />;
      default:
        return <IconClock size='1rem' />;
    }
  };

  const clearanceStatus = getOverallClearanceStatus();

  return (
    <Container size='md' px='xs'>
      <Stack gap='xl'>
        {/* Header Section */}
        <Paper withBorder p='md' radius='md'>
          <Stack gap='md'>
            <Group justify='space-between' align='flex-start' wrap='wrap'>
              <Box>
                <Title order={1} size='h2' fw={600} mb='xs'>
                  Registration Request
                </Title>
                <Text c='dimmed' size='sm'>
                  {registration.term.name} •{' '}
                  {formatSemester(registration.semesterNumber)}
                </Text>
              </Box>
              <Badge
                size='lg'
                color={getStatusColor(registration.status)}
                variant='light'
              >
                {registration.status}
              </Badge>
            </Group>

            <Divider />

            {/* Student Info Grid */}
            <Grid>
              <GridCol span={{ base: 12, xs: 6, sm: 4 }}>
                <Stack gap={4}>
                  <Text size='xs' c='dimmed' fw={500} tt='uppercase'>
                    Student
                  </Text>
                  <Text fw={500} size='sm'>
                    {registration.student.name}
                  </Text>
                  <Text size='xs' c='dimmed' ff='monospace'>
                    {registration.stdNo}
                  </Text>
                </Stack>
              </GridCol>

              <GridCol span={{ base: 12, xs: 6, sm: 4 }}>
                <Stack gap={4}>
                  <Text size='xs' c='dimmed' fw={500} tt='uppercase'>
                    Semester Status
                  </Text>
                  <Badge
                    size='sm'
                    color={
                      registration.semesterStatus === 'Active' ? 'blue' : 'red'
                    }
                    variant='light'
                  >
                    {registration.semesterStatus}
                  </Badge>
                </Stack>
              </GridCol>

              <GridCol span={{ base: 12, xs: 12, sm: 4 }}>
                <Stack gap={4}>
                  <Text size='xs' c='dimmed' fw={500} tt='uppercase'>
                    Submitted
                  </Text>
                  <Text size='sm' fw={500}>
                    {formatDateTime(registration.createdAt)}
                  </Text>
                </Stack>
              </GridCol>
            </Grid>

            {/* Quick Stats */}
            <Grid mt='xs'>
              <GridCol span={{ base: 6, sm: 4 }}>
                <Card withBorder p='sm' bg='blue.0'>
                  <Group gap='xs'>
                    <IconBooks
                      size='1rem'
                      color='var(--mantine-color-blue-6)'
                    />
                    <Stack gap={2}>
                      <Text size='lg' fw={600} c='blue'>
                        {registration.requestedModules.length}
                      </Text>
                      <Text size='xs' c='dimmed'>
                        Modules
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </GridCol>

              <GridCol span={{ base: 6, sm: 4 }}>
                <Card
                  withBorder
                  p='sm'
                  bg={`${getStatusColor(clearanceStatus)}.0`}
                >
                  <Group gap='xs'>
                    <IconBuildingBank
                      size='1rem'
                      color={`var(--mantine-color-${getStatusColor(clearanceStatus)}-6)`}
                    />
                    <Stack gap={2}>
                      <Text
                        size='lg'
                        fw={600}
                        c={getStatusColor(clearanceStatus)}
                      >
                        {clearanceStatus}
                      </Text>
                      <Text size='xs' c='dimmed'>
                        Clearance
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </GridCol>

              {registration.dateApproved && (
                <GridCol span={{ base: 12, sm: 4 }}>
                  <Card withBorder p='sm' bg='green.0'>
                    <Group gap='xs'>
                      <IconCalendar
                        size='1rem'
                        color='var(--mantine-color-green-6)'
                      />
                      <Stack gap={2}>
                        <Text size='lg' fw={600} c='green'>
                          Approved
                        </Text>
                        <Text size='xs' c='dimmed'>
                          {formatDateTime(registration.dateApproved)}
                        </Text>
                      </Stack>
                    </Group>
                  </Card>
                </GridCol>
              )}
            </Grid>

            {registration.message && (
              <>
                <Divider />
                <Box>
                  <Text size='xs' c='dimmed' fw={500} tt='uppercase' mb='xs'>
                    Message
                  </Text>
                  <Paper withBorder bg='gray.0' p='sm'>
                    <Text size='sm'>{registration.message}</Text>
                  </Paper>
                </Box>
              </>
            )}
          </Stack>
        </Paper>

        {/* Tabs Section */}
        <Tabs defaultValue='modules' variant='outline'>
          <TabsList>
            <TabsTab value='modules' leftSection={<IconBooks size='1rem' />}>
              Modules ({registration.requestedModules.length})
            </TabsTab>
            <TabsTab
              value='clearance'
              leftSection={
                <ThemeIcon
                  color={getStatusColor(clearanceStatus)}
                  variant='light'
                  size={20}
                >
                  {getStatusIcon(clearanceStatus)}
                </ThemeIcon>
              }
            >
              Clearance Status
            </TabsTab>
          </TabsList>

          <TabsPanel value='modules'>
            <Box mt='md'>
              <ModulesView registration={registration} />
            </Box>
          </TabsPanel>

          <TabsPanel value='clearance'>
            <Box mt='md'>
              <ClearanceStatusView registration={registration} />
            </Box>
          </TabsPanel>
        </Tabs>
      </Stack>
    </Container>
  );
}
