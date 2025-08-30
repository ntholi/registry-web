import { getStatusColor } from '@/app/student/utils/colors';
import { auth } from '@/auth';
import { formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
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
import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';
import ProofOfRegistrationDownload from '../components/ProofOfRegistrationDownload';
import ClearanceStatusView from './ClearanceStatusView';
import DepartmentMessagesView from './DepartmentMessagesView';
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

  const clearanceStatus = getOverallClearanceStatus(registration);

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
                color={getStatusColor(clearanceStatus)}
                variant='light'
              >
                {clearanceStatus}
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
              {registration.status === 'registered' && (
                <ProofOfRegistrationDownload
                  stdNo={registration.stdNo}
                  termName={registration.term.name}
                  semesterNumber={registration.semesterNumber}
                />
              )}
            </Flex>

            {/* Use DepartmentMessagesView to display either department messages or registration message */}
            <DepartmentMessagesView registration={registration} />
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

export function getOverallClearanceStatus(
  registration: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>
) {
  if (!registration.clearances || registration.clearances.length === 0) {
    return 'pending';
  }

  const anyRejected = registration.clearances.some(
    (c) => c.clearance.status === 'rejected'
  );
  if (anyRejected) return 'rejected';

  const allApproved = registration.clearances.every(
    (c) => c.clearance.status === 'approved'
  );
  if (allApproved) return 'approved';

  return registration.status;
}
