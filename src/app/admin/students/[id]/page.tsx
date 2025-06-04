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

  const showRegistrationTab =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'registry' ||
    session?.user?.position === 'admin' ||
    session?.user?.position === 'manager' ||
    session?.user?.position === 'program_leader' ||
    session?.user?.position === 'year_leader';

  const registrationRequests = await getRegistrationRequestsByStudent(
    student.stdNo,
  );

  return (
    <DetailsView>
      <DetailsViewHeader title={student.name} queryKey={['students']} />
      <StudentTabs
        student={student}
        showRegistrationTab={showRegistrationTab}
        registrationRequests={registrationRequests}
      />
    </DetailsView>
  );
}
