import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getStudent, deleteStudent } from '@/server/students/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetails({ params }: Props) {
  const { id } = await params;
  const student = await getStudent(Number(id));

  if (!student) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Student'}
        queryKey={['students']}
        handleDelete={async () => {
          'use server';
          await deleteStudent(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Student No'>{student.stdNo}</FieldView>
        <FieldView label='National Id'>{student.nationalId}</FieldView>
        <FieldView label='Name'>{student.name}</FieldView>
        <FieldView label='Phone 1'>{student.phone1}</FieldView>
        <FieldView label='Phone 2'>{student.phone2}</FieldView>
        <FieldView label='Religion'>{student.religion}</FieldView>
        <FieldView label='Date of Birth'>
          {new Date(student.dateOfBirth).toLocaleDateString()}
        </FieldView>
        <FieldView label='Gender'>{student.gender}</FieldView>
        <FieldView label='Marital Status'>{student.maritalStatus}</FieldView>
        <FieldView label='Structure ID'>{student.structureId}</FieldView>
        <FieldView label='User ID'>{student.userId}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
