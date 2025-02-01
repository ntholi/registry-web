import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { notFound } from 'next/navigation';
import RequestBody from './RequestBody';
import {
  deleteClearanceTask,
  getClearanceTask,
} from '@/server/clearance-tasks/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceRequestDetails({ params }: Props) {
  const { id } = await params;
  const request = await getClearanceTask(Number(id));

  if (!request) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Clearance'}
        queryKey={['clearanceTasks']}
        handleDelete={async () => {
          'use server';
          await deleteClearanceTask(Number(id));
        }}
      />
      <RequestBody request={request} />
    </DetailsView>
  );
}
