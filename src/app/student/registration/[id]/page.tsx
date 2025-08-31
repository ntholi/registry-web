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
import { getOverallClearanceStatus, getStatusIcon } from '../utils';
import DepartmentMessagesView from './DepartmentMessagesView';
import ModulesView from './ModulesView';
import ClearanceStatusView from './ClearanceStatusView';

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
