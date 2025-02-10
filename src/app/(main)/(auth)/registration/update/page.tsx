import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
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
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
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
    currentTerm.id
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
        <Button variant='outline' size='icon' asChild>
          <Link href='/registration'>
            <ArrowLeftIcon className='h-4 w-4' />
          </Link>
        </Button>
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
              semester={student.sem + 1}
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
