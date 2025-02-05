import React from 'react';
import { getTranscript } from './actions';
import { auth } from '@/auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default async function TranscriptsPage() {
  const session = await auth();
  if (!session?.user?.stdNo) return null;

  const programs = await getTranscript(session.user.stdNo);

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <h1 className='text-3xl font-bold'>Academic Transcript</h1>
      <p className='text-muted-foreground'>
        Student No: {session.user.stdNo} | Name: {session.user.name}
      </p>

      {programs.map((program) => (
        <Card key={program.id} className='overflow-hidden'>
          <CardHeader className='bg-muted'>
            <h2 className='text-xl font-semibold'>{program.name}</h2>
            <p className='text-sm text-muted-foreground'>
              Program Code: {program.code}
            </p>
          </CardHeader>
          <CardContent className='p-6'>
            {program.semesters.map((semester) => (
              <div key={semester.id} className='mb-8 last:mb-0'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-medium'>Term {semester.term}</h3>
                  <Badge
                    variant={
                      semester.status === 'Active' ? 'default' : 'destructive'
                    }
                  >
                    {semester.status}
                  </Badge>
                </div>

                <div className='rounded-lg border'>
                  <div className='grid grid-cols-12 gap-4 p-4 bg-muted text-sm font-medium'>
                    <div className='col-span-2'>Code</div>
                    <div className='col-span-4'>Module</div>
                    <div className='col-span-2'>Type</div>
                    <div className='col-span-1'>Credits</div>
                    <div className='col-span-1'>Marks</div>
                    <div className='col-span-2'>Grade</div>
                  </div>

                  {semester.modules.map((module, index) => (
                    <div key={module.id}>
                      {index > 0 && <Separator />}
                      <div className='grid grid-cols-12 gap-4 p-4 text-sm items-center'>
                        <div className='col-span-2 font-mono'>
                          {module.code}
                        </div>
                        <div className='col-span-4'>{module.name}</div>
                        <div className='col-span-2'>
                          <Badge variant='outline'>{module.type}</Badge>
                        </div>
                        <div className='col-span-1'>{module.credits}</div>
                        <div className='col-span-1'>{module.marks}</div>
                        <div className='col-span-2'>
                          <Badge
                            variant={
                              module.grade === 'F' ? 'destructive' : 'default'
                            }
                            className='w-12 justify-center'
                          >
                            {module.grade}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
