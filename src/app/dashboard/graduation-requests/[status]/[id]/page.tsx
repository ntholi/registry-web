import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getGraduationRequest, deleteGraduationRequest } from '@/server/graduation-requests/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GraduationRequestDetails({ params }: Props) {
  const { id } = await params;
  const graduationRequest = await getGraduationRequest(Number(id));
  
  if (!graduationRequest) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Graduation Request'} 
        queryKey={['graduation-requests']}
        handleDelete={async () => {
          'use server';
          await deleteGraduationRequest(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Std No'>{graduationRequest.stdNo}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}