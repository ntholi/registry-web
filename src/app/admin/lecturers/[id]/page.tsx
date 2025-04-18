import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getLecturer, deleteLecturer } from '@/server/lecturers/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LecturerDetails({ params }: Props) {
  const { id } = await params;
  const lecturer = await getLecturer(Number(id));
  
  if (!lecturer) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Lecturer'} 
        queryKey={['lecturers']}
        handleDelete={async () => {
          'use server';
          await deleteLecturer(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='User'>{lecturer.user}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}