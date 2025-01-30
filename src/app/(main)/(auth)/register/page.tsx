import { auth } from '@/auth';
import React from 'react';
import { getStudentByUserId } from '@/server/students/actions';
import { redirect } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { formatSemester } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default async function RegistrationPage() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) {
    redirect('/register');
  }

  const semesterModules =
    student.structure?.semesters[student.sem]?.semesterModules || [];

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
          <form action='' className='space-y-6'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between pb-4 border-b'>
                <h3 className='text-lg font-semibold'>Available Modules</h3>
                <p className='text-sm text-muted-foreground'>
                  Select the modules you wish to register for
                </p>
              </div>

              <ScrollArea className='h-[400px] pr-4'>
                <div className='space-y-4'>
                  {semesterModules.map(({ module }) => (
                    <div
                      key={module.code}
                      className='flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors'
                    >
                      <Checkbox id={module.code} />
                      <div className='flex-1 space-y-1'>
                        <Label
                          htmlFor={module.code}
                          className='text-base font-medium cursor-pointer'
                        >
                          {module.name}
                        </Label>
                        <div className='flex items-center space-x-2'>
                          <span className='text-sm font-mono text-muted-foreground'>
                            {module.code}
                          </span>
                          <span className='text-sm text-muted-foreground'>
                            •
                          </span>
                          <span className='text-sm capitalize text-muted-foreground'>
                            {module.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className='flex justify-end pt-4 border-t'>
              <Button type='submit' size='lg'>
                Register Selected Modules
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
