import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getClearanceResponse, deleteClearanceResponse } from '@/server/clearance-responses/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceResponseDetails({ params }: Props) {
  const { id } = await params;
  const clearanceResponse = await getClearanceResponse(Number(id));
  
  if (!clearanceResponse) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Clearance Response'} 
        queryKey={['clearanceResponses']}
        handleDelete={async () => {
          'use server';
          await deleteClearanceResponse(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Clearance Request'>{clearanceResponse.clearanceRequest}</FieldView>
        <FieldView label='Department'>{clearanceResponse.department}</FieldView>
        <FieldView label='Cleared By'>{clearanceResponse.clearedBy}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}