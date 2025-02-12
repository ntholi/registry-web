import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { redirect } from 'next/navigation';
import ClearanceRequestForm from './form';
import { getStudentByUserId } from '@/server/students/actions';

export default async function Page() {
  const session = await auth();

  const student = await getStudentByUserId(session?.user?.id);
  if (!student) {
    redirect('/signup');
  }

  return (
    <Container width='sm' className='pt-4 sm:pt-10'>
      <ClearanceRequestForm
        stdNo={student.stdNo}
        currentSemester={student.sem}
      />
    </Container>
  );
}
