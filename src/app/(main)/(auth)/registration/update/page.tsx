import { auth } from '@/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { formatSemester } from '@/lib/utils';
import { getStudentByUserId } from '@/server/students/actions';
import { redirect } from 'next/navigation';
import { getCurrentTerm } from '@/server/terms/actions';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
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

  const existingRequest = await getRegistrationRequestByStdNo(
    student.stdNo,
    currentTerm.id
  );

  if (!existingRequest) {
    redirect('/registration/request');
  }

  return (
    <Container className='pt-4 sm:pt-10'>
      <Card className='max-w-3xl mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Update Module Registration
          </CardTitle>
          <CardDescription>
            Modify your module selection for {formatSemester(student.sem + 1)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {student.structureId ? (
            <ModulesForm
              stdNo={student.stdNo}
              structureId={student.structureId}
              semester={student.sem + 1}
              registrationId={existingRequest.id}
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
