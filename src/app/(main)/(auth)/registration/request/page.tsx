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
import ModulesForm from './Form';
import { getCurrentTerm } from '@/server/terms/actions';
import { getFailedModules } from '../remain/actions';

export default async function RegistrationPage() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);
  const term = await getCurrentTerm();

  if (!student) {
    redirect('/signup');
  }

  const failedModules = await getFailedModules(student.stdNo, student.sem);
  if (failedModules.length >= 3) {
    redirect('/registration/remain');
  }

  return (
    <Container className='pt-4 sm:pt-10'>
      <Card className='mx-auto max-w-3xl'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Module Registration
          </CardTitle>
          <CardDescription>Register for {term.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {student.structureId ? (
            <ModulesForm
              stdNo={student.stdNo}
              structureId={student.structureId}
              semester={student.sem + 1}
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
