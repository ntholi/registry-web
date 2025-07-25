import { auth } from '@/auth';
import { formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  Badge,
  Box,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBooks, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { forbidden, notFound } from 'next/navigation';
import ClearanceStatusView from './ClearanceStatusView';
import ModulesView from './ModulesView';

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
        <Paper withBorder p='md'>
          <Stack gap='md'>
            <Group justify='space-between' align='flex-start' wrap='wrap'>
              <Box>
                <Title order={1} size='h2' fw={600} mb='xs'>
                  Registration
                </Title>
                <Text c='dimmed' size='sm'>
                  {registration.term.name} •{' '}
                  {formatSemester(registration.semesterNumber)}
                </Text>
              </Box>
              <Badge
                radius='xs'
                color={getStatusColor(registration.status)}
                variant='light'
              >
                {registration.status}
              </Badge>
            </Group>

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
