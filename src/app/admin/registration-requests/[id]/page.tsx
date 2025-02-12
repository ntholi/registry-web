import { DetailsView, DetailsViewHeader } from '@/components/adease';
import {
  deleteRegistrationRequest,
  getRegistrationRequest,
} from '@/server/registration-requests/actions';
import { Tabs, TabsList, TabsPanel, TabsTab, Stack } from '@mantine/core';
import { notFound } from 'next/navigation';
import RequestDetailsView from './RequestDetailsView';
import ModulesView from './ModulesView';
import ClearanceAccordion from './ClearanceAccordion';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RegistrationRequestDetails({ params }: Props): Promise<JSX.Element> {
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
        handleDelete={async () => {
          'use server';
          await deleteRegistrationRequest(Number(id));
        }}
      />
      <Tabs defaultValue="details" variant="outline">
        <TabsList>
          <TabsTab value="details">Details</TabsTab>
          <TabsTab value="clearance">Clearance</TabsTab>
        </TabsList>
        <TabsPanel value="details">
          <Stack gap="xl" mt="xl" p="sm">
            <RequestDetailsView value={registrationRequest} />
            <ModulesView value={registrationRequest} />
          </Stack>
        </TabsPanel>
        <TabsPanel value="clearance">
          <Stack gap="xl" mt="xl" p="sm">
            <ClearanceAccordion value={registrationRequest} />
          </Stack>
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
