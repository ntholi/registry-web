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
import { Loader2 } from 'lucide-react';

export default function RegistrationPage() {
  const { student, studentProgram, isLoading } = useUserStudent();
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
          {isLoading ? (
            <div className='flex items-center justify-center p-10'>
              <Loader2 className='h-10 w-10 animate-spin' />
            </div>
          ) : student && studentProgram ? (
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
