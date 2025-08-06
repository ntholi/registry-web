import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import {
  getBlockedStudent,
  deleteBlockedStudent,
} from '@/server/blocked-students/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BlockedStudentDetails({ params }: Props) {
  const { id } = await params;
  const blockedStudent = await getBlockedStudent(Number(id));

  if (!blockedStudent) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={blockedStudent.student.name}
        queryKey={['blocked-students']}
        editRoles={['finance']}
        handleDelete={async () => {
          'use server';
          await deleteBlockedStudent(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Std No'>{blockedStudent.stdNo}</FieldView>
        <FieldView label='Status'>{blockedStudent.status}</FieldView>
        <FieldView label='Reason'>{blockedStudent.reason}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
