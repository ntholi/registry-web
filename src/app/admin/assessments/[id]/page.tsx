import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getAssessment, deleteAssessment } from '@/server/assessments/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AssessmentDetails({ params }: Props) {
  const { id } = await params;
  const assessment = await getAssessment(Number(id));
  
  if (!assessment) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader 
        title={'Assessment'} 
        queryKey={['assessments']}
        handleDelete={async () => {
          'use server';
          await deleteAssessment(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Assessment Number'>{assessment.assessmentNumber}</FieldView>
        <FieldView label='Assessment Type'>{assessment.assessmentType}</FieldView>
        <FieldView label='Total Marks'>{assessment.totalMarks}</FieldView>
        <FieldView label='Weight'>{assessment.weight}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}