import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { getStudent } from '@/server/students/actions';
import { notFound } from 'next/navigation';
import { getRegistrationRequestsByStudent } from '@/server/registration-requests/actions';
import { auth } from '@/auth';
import { StudentTabs } from './StudentTabs';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetails({ params }: Props) {
  const { id } = await params;
  const student = await getStudent(Number(id));
  const session = await auth();

  if (!student) {
    return notFound();
  }

  const registrationRequests = await getRegistrationRequestsByStudent(
    student.stdNo,
  );

  return (
    <DetailsView>
      <DetailsViewHeader title={student.name} queryKey={['students']} />
      <StudentTabs
        student={student}
        session={session}
        registrationRequests={registrationRequests}
      />
    </DetailsView>
  );
}
