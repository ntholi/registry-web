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
import { getRepeatModules } from './actions';

export default async function RegistrationPage() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) {
    redirect('/signup');
  }
  const repeatModules = await getRepeatModules(student.stdNo);
  console.log(repeatModules);

  return (
    <Container className='pt-4 sm:pt-10'>
      <Card className='max-w-3xl mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Module Registration
          </CardTitle>
          <CardDescription>
            Register for {formatSemester(student.sem + 1)}
          </CardDescription>
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
