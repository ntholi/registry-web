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
import { Info } from 'lucide-react';

export default async function RemainPage() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) {
    redirect('/signup');
  }

  const failedModules = await getFailedModules(student.stdNo, student.sem);

  return (
    <Container className='pt-4 sm:pt-10'>
      <Card className='mx-auto max-w-3xl'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>
            Registration Status
          </CardTitle>
          <CardDescription>
            Your eligibility for next semester registration
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <Alert variant='destructive'>
            <Info className='h-4 w-4' />
            <AlertTitle>Registration Not Allowed</AlertTitle>
            <AlertDescription>
              You have failed {failedModules.length} modules in your current
              semester. According to academic policy, students who fail 3 or
              more modules must remain in their current semester.
            </AlertDescription>
          </Alert>

          <div>
            <h3 className='mb-3 text-lg font-semibold'>Failed Modules:</h3>
            <ul className='space-y-2'>
              {failedModules.map((module) => (
                <li
                  key={module.code}
                  className='flex items-center justify-between rounded-md p-3 text-sm'
                >
                  <p>
                    <span className='font-mono text-muted-foreground'>
                      {module.code}:
                    </span>{' '}
                    {module.name}
                  </p>
                  <Badge variant='outline'>{module.marks}/100</Badge>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
