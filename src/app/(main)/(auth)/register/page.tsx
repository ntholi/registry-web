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
import RegisterForm from './RegisterForm';

export default async function RegistrationPage() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) {
    redirect('/register');
  }

  return (
    <Container className='py-8'>
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
          <RegisterForm stdNo={student.stdNo} />
        </CardContent>
      </Card>
    </Container>
  );
}
