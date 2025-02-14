import { DetailsView, DetailsViewHeader } from '@/components/adease';
import {
  deleteRegistrationClearance,
  getRegistrationClearance,
} from '@/server/registration-clearance/actions';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import ClearanceDetails from './ClearanceDetails';
import ClearanceHistory from './ClearanceHistory';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceRequestDetails({ params }: Props) {
  const { id } = await params;
  const request = await getRegistrationClearance(Number(id));

  if (!request) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={request.registrationRequest.student.name}
        queryKey={['registrationClearances']}
        handleDelete={async () => {
          'use server';
          await deleteRegistrationClearance(Number(id));
        }}
      />
      <Tabs defaultValue='details' variant='outline'>
        <TabsList>
          <TabsTab value='details'>Details</TabsTab>
          <TabsTab value='history'>History</TabsTab>
        </TabsList>
        <TabsPanel value='details'>
          <ClearanceDetails request={request} />
        </TabsPanel>
        <TabsPanel value='history'>
          <ClearanceHistory clearanceId={Number(id)} />
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
