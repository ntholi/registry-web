import { DetailsView } from '@/components/adease';
import { getGraduationClearance } from '@/server/graduation/clearance/actions';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import GraduationClearanceDetails from './GraduationClearanceDetails';
import GraduationClearanceHistory from './GraduationClearanceHistory';
import GraduationClearanceHeader from './GraduationClearanceHeader';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GraduationClearanceRequestDetails({
  params,
}: Props) {
  const { id } = await params;
  const request = await getGraduationClearance(Number(id));

  if (!request) {
    return notFound();
  }

  return (
    <DetailsView>
      <GraduationClearanceHeader
        studentName={request.graduationRequest.student.name}
        stdNo={request.graduationRequest.student.stdNo}
      />
      <Tabs defaultValue='details' variant='outline'>
        <TabsList>
          <TabsTab value='details'>Details</TabsTab>
          <TabsTab value='history'>History</TabsTab>
        </TabsList>
        <TabsPanel value='details'>
          <GraduationClearanceDetails request={request} />
        </TabsPanel>
        <TabsPanel value='history'>
          <GraduationClearanceHistory
            stdNo={request.graduationRequest.student.stdNo}
          />
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
