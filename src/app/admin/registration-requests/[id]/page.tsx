import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getRegistrationRequest, deleteRegistrationRequest } from '@/server/registration-requests/actions';

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
      <DetailsViewBody>
        <FieldView label='Std No'>{registrationRequest.stdNo}</FieldView>
        <FieldView label='Term'>{registrationRequest.term}</FieldView>
        <FieldView label='Status'>{registrationRequest.status}</FieldView>
        <FieldView label='Message'>{registrationRequest.message}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}