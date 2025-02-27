import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { DashboardUser, registrationRequestStatusEnum } from '@/db/schema';
import {
  deleteRegistrationRequest,
  getRegistrationRequest,
} from '@/server/registration-requests/actions';
import {
  Divider,
  Group,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import ClearanceAccordion from './ClearanceAccordion';
import ModulesView from './ModulesView';
import RequestDetailsView from './RequestDetailsView';

interface Props {
  params: Promise<{ id: string }>;
}

function getOverallClearanceStatus(
  registrationRequest: NonNullable<
    Awaited<ReturnType<typeof getRegistrationRequest>>
  >,
) {
  const departments: DashboardUser[] = ['finance', 'library'];
  const statuses = departments.map((dept) => {
    const clearance = registrationRequest.clearances?.find(
      (c) => c.department === dept,
    );
    return clearance?.status || 'pending';
  });

  if (statuses.some((status) => status === 'rejected')) return 'rejected';
  if (statuses.some((status) => status === 'pending')) return 'pending';
  return 'approved';
}

function getStatusColor(
  status: (typeof registrationRequestStatusEnum)[number],
) {
  switch (status) {
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'yellow';
  }
}

function getStatusIcon(status: (typeof registrationRequestStatusEnum)[number]) {
  switch (status) {
    case 'approved':
      return <IconCheck size={16} />;
    case 'rejected':
      return <IconX size={16} />;
    default:
      return <IconClock size={16} />;
  }
}

export default async function RegistrationRequestDetails({ params }: Props) {
  const { id } = await params;
  const registrationRequest = await getRegistrationRequest(Number(id));

  if (!registrationRequest) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={registrationRequest.student.name}
        queryKey={['registrationRequests']}
        editRoles={['registry']}
        handleDelete={async () => {
          'use server';
          await deleteRegistrationRequest(Number(id));
        }}
      />
      <Tabs defaultValue='details' variant='outline'>
        <TabsList>
          <TabsTab value='details'>Details</TabsTab>
          <TabsTab value='clearance'>
            <Group gap='xs'>
              <ThemeIcon
                color={getStatusColor(
                  getOverallClearanceStatus(registrationRequest),
                )}
                variant='light'
                size={20}
              >
                {getStatusIcon(getOverallClearanceStatus(registrationRequest))}
              </ThemeIcon>
              Clearance
            </Group>
          </TabsTab>
        </TabsList>
        <TabsPanel value='details'>
          <Stack mt='md' p='sm'>
            <RequestDetailsView value={registrationRequest} />
            <Divider />
            <ModulesView value={registrationRequest} />
          </Stack>
        </TabsPanel>
        <TabsPanel value='clearance'>
          <Stack gap='xl' mt='md' p='sm'>
            <ClearanceAccordion value={registrationRequest} />
          </Stack>
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
