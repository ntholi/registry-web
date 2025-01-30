import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { formatSemester } from '@/lib/utils';
import { getStudentByUserId } from '@/server/students/actions';
import { GraduationCap } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) return notFound();

  return (
    <>
      <Container width='lg' className='sm:py-10'>
        <Card>
          <CardHeader className='border-b border-border/10 pb-8 items-start'>
            <CardTitle className='text-3xl font-bold tracking-tight sm:text-4xl'>
              {student.name}
            </CardTitle>
            <div className='flex flex-col space-y-1 items-start'>
              <Badge
                variant='secondary'
                className='flex items-center gap-2 rounded-full'
              >
                <GraduationCap className='size-5' />
                {student.structure?.program.name}
              </Badge>
              <div className='pl-2 flex gap-2 items-center text-sm text-muted-foreground/80'>
                {formatSemester(student.sem)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 grid-cols-2'>
              <div className='rounded-xl bg-muted/30 p-6 shadow-sm transition-all hover:shadow'>
                <h3 className='text-sm font-medium text-muted-foreground'>
                  CGPA
                </h3>
                <div className='mt-3 flex items-baseline'>
                  <span className='text-4xl font-bold tracking-tight'>3.8</span>
                  <span className='ml-2 text-sm text-muted-foreground'>
                    {' '}
                    / 4.0
                  </span>
                </div>
              </div>
              <div className='rounded-xl bg-muted/30 p-6 shadow-sm transition-all hover:shadow'>
                <h3 className='text-sm font-medium text-muted-foreground'>
                  Total Credits
                </h3>
                <div className='mt-3 flex items-baseline'>
                  <span className='text-4xl font-bold tracking-tight'>85</span>
                  <span className='ml-2 text-sm text-muted-foreground'>
                    {' '}
                    / 120
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
