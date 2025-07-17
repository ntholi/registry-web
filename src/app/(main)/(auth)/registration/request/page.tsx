'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';
import ModulesForm from './Form';

export default async function RegistrationPage() {
  const { student, studentProgram } = useUserStudent();
  const { currentTerm } = useCurrentTerm();

  return (
    <Container className='pt-4 sm:pt-10'>
      <Card className='mx-auto max-w-3xl'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Module Registration
          </CardTitle>
          <CardDescription>Register for {currentTerm?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {student && studentProgram ? (
            <ModulesForm
              stdNo={student.stdNo}
              structureId={studentProgram.structureId}
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
