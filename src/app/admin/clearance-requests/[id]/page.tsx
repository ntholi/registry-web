import { DetailsView, DetailsViewHeader } from '@/components/adease';
import {
  deleteClearanceRequest,
  getClearanceRequest,
} from '@/server/clearance-requests/actions';
import { notFound } from 'next/navigation';
import RequestBody from './RequestBody';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceRequestDetails({ params }: Props) {
  const { id } = await params;
  const request = await getClearanceRequest(Number(id));

  if (!request) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Clearance Request'}
        queryKey={['clearanceRequests']}
        handleDelete={async () => {
          'use server';
          await deleteClearanceRequest(Number(id));
        }}
      />
      <RequestBody request={request} />
    </DetailsView>
  );
}
