import { auth } from '@/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getStudentByUserId } from '@/server/students/actions';
import { redirect } from 'next/navigation';
import { getFailedModules } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BookX } from 'lucide-react';

export default async function RemainPage() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) {
    redirect('/signup');
  }

  const failedModules = await getFailedModules(student.stdNo, student.sem);

  return (
    <Container className='py-8 sm:py-12'>
      <Card className='mx-auto max-w-3xl'>
        <CardHeader>
          <CardTitle className='text-center text-2xl font-bold sm:text-3xl'>
            Registration Status
          </CardTitle>
          <CardDescription className='text-center'>
            Your eligibility for next semester registration
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <Alert variant='destructive'>
            <AlertTriangle className='h-5 w-5' />
            <AlertTitle>Registration Not Allowed</AlertTitle>
            <AlertDescription>
              You have failed {failedModules.length} modules in your current
              semester. According to academic policy, students who fail 3 or
              more modules must remain in their current semester.
            </AlertDescription>
          </Alert>

          <div>
            <h3 className='mb-4 text-xl font-semibold'>Failed Modules:</h3>
            <ul className='space-y-3'>
              {failedModules.map((module) => (
                <li
                  key={module.code}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div className='flex items-center space-x-3'>
                    <BookX className='size-4 text-red-500' />
                    <div>
                      <span className='font-mono text-sm text-muted-foreground'>
                        {module.code}
                      </span>
                      <p className='font-medium'>{module.name}</p>
                    </div>
                  </div>
                  <Badge variant='secondary'>{module.marks}/100</Badge>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
