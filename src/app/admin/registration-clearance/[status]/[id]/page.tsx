import { DetailsView, DetailsViewHeader } from '@/components/adease';
import {
  deleteRegistrationClearance,
  getRegistrationClearance,
} from '@/server/registration-clearance/actions';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import AcademicsLoader from './AcademicsLoader';
import ClearanceDetails from './ClearanceDetails';
import ClearanceHistory from './ClearanceHistory';
import { auth } from '@/auth';
import { getCurrentTerm } from '@/server/terms/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceRequestDetails({ params }: Props) {
  const { id } = await params;
  const request = await getRegistrationClearance(Number(id));
  const session = await auth();
  const term = await getCurrentTerm();

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
          {session?.user?.role === 'finance' && (
            <TabsTab value='academics'>Academics</TabsTab>
          )}
          <TabsTab value='history'>History</TabsTab>
        </TabsList>
        <TabsPanel value='details'>
          <ClearanceDetails request={request} termId={term.id} />
        </TabsPanel>
        <TabsPanel value='academics'>
          <AcademicsLoader stdNo={request.registrationRequest.student.stdNo} />
        </TabsPanel>
        <TabsPanel value='history'>
          <ClearanceHistory clearanceId={Number(id)} />
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
