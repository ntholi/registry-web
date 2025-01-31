import { DetailsView, DetailsViewHeader } from '@/components/adease';
import {
  deleteRegistrationRequest,
  getRegistrationRequest,
} from '@/server/registration-requests/actions';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import RequestDetailsView from './RequestDetailsView';
import ModulesView from './ModulesView';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RegistrationRequestDetails({ params }: Props) {
  const { id } = await params;
  const registrationRequest = await getRegistrationRequest(Number(id));

  if (!registrationRequest) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Registration Request'}
        queryKey={['registrationRequests']}
        handleDelete={async () => {
          'use server';
          await deleteRegistrationRequest(Number(id));
        }}
      />
      <Tabs defaultValue='modules' variant='outline' mt={'xl'}>
        <TabsList>
          <TabsTab value='details'>Details</TabsTab>
          <TabsTab value='modules'>Modules</TabsTab>
        </TabsList>
        <TabsPanel value='modules' pt={'xl'} p={'sm'}>
          <RequestDetailsView value={registrationRequest} />
        </TabsPanel>
        <TabsPanel value='details' pt={'xl'} p={'sm'}>
          <ModulesView value={registrationRequest} />
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
