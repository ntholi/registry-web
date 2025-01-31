import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import {
  getClearanceRequest,
  deleteClearanceRequest,
} from '@/server/clearance-requests/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceRequestDetails({ params }: Props) {
  const { id } = await params;
  const clearanceRequest = await getClearanceRequest(Number(id));

  if (!clearanceRequest) {
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
      <DetailsViewBody>
        <FieldView label='Std No'>{clearanceRequest.stdNo}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
