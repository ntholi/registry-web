import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import {
  getGraduationClearance,
  deleteGraduationClearance,
} from '@/server/graduation-clearance/actions';
import GraduationStatusSwitch from './status/GraduationStatusSwitch';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GraduationRequestDetails({ params }: Props) {
  const { id } = await params;
  const clearance = await getGraduationClearance(Number(id));

  if (!clearance) {
    return notFound();
  }

  type StudentLite = { stdNo: number; name: string };
  type GraduationClearanceView = {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    graduationRequest?: { student?: StudentLite } | null;
  };
  const view = clearance as unknown as GraduationClearanceView;

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Graduation Clearance'}
        queryKey={['graduation-clearances']}
        handleDelete={async () => {
          'use server';
          await deleteGraduationClearance(Number(id));
        }}
      />
      <DetailsViewBody>
        {view?.graduationRequest?.student && (
          <>
            <FieldView label='Std No'>
              {view.graduationRequest.student.stdNo}
            </FieldView>
            <FieldView label='Student Name'>
              {view.graduationRequest.student.name}
            </FieldView>
          </>
        )}
        <GraduationStatusSwitch
          request={{ id: view.id, status: view.status }}
        />
      </DetailsViewBody>
    </DetailsView>
  );
}
