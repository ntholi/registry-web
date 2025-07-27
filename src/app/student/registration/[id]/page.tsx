import { auth } from '@/auth';
import { formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { getStatusColor } from '@/app/student/utils/colors';
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
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
import {
  IconBooks,
  IconCheck,
  IconClock,
  IconEdit,
  IconX,
} from '@tabler/icons-react';
import { forbidden, notFound } from 'next/navigation';
import Link from 'next/link';
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
          <Box>
            <Group justify='space-between' align='flex-start' wrap='wrap'>
              <Title order={1} size='h2' fw={600} mb='xs'>
                Registration
              </Title>
              <Badge
                radius='xs'
                color={getStatusColor(registration.status)}
                variant='light'
              >
                {registration.status}
              </Badge>
            </Group>

            <Flex justify={'space-between'} align={'center'}>
              <Text c='dimmed' size='sm'>
                {registration.term.name} •{' '}
                {formatSemester(registration.semesterNumber)}
              </Text>
              {registration.status === 'pending' && (
                <Button
                  component={Link}
                  href={`/student/registration/${registration.id}/edit`}
                  variant='subtle'
                  mr={-10}
                  size='xs'
                  leftSection={<IconEdit size={16} />}
                >
                  Update
                </Button>
              )}
            </Flex>

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
          </Box>
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
