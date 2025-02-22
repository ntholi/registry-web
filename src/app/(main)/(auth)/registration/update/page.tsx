import { auth } from '@/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { getStudentByUserId } from '@/server/students/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { redirect } from 'next/navigation';
import BackButton from '../status/BackButton';
import ModulesForm from './Form';

export default async function UpdateRegistrationPage() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);
  const currentTerm = await getCurrentTerm();

  if (!student) {
    redirect('/signup');
  }

  if (!currentTerm) {
    redirect('/');
  }

  const request = await getRegistrationRequestByStdNo(
    student.stdNo,
    currentTerm.id,
  );

  if (request?.status === 'approved') {
    redirect('/');
  }

  if (!request) {
    redirect('/registration/request');
  }

  return (
    <Container width='md' className='pt-4 sm:pt-10'>
      <div className='flex items-center gap-4'>
        <BackButton />
        <div>
          <h1 className='text-2xl font-semibold'>Update Registration</h1>
        </div>
      </div>
      <Card className='mt-6'>
        <CardHeader>
          <CardDescription>
            Select or deselect the modules you wish to add or remove from your
            registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {student.structureId ? (
            <ModulesForm
              stdNo={student.stdNo}
              structureId={student.structureId}
              request={request}
            />
          ) : (
            <p className='text-red-500'>
              You are not registered for any program
            </p>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
