import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { notFound } from 'next/navigation';
import RequestBody from './RequestBody';
import {
  deleteRegistrationClearance,
  getRegistrationClearance,
} from '@/server/registration-clearance/actions';

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
        title={'Clearance'}
        queryKey={['registrationClearances']}
        handleDelete={async () => {
          'use server';
          await deleteRegistrationClearance(Number(id));
        }}
      />
      <RequestBody request={request} />
    </DetailsView>
  );
}
