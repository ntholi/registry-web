'use client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useUserStudent from '@/hooks/use-user-student';
import { formatSemester } from '@/lib/utils';
import { AlertCircle, Container, GraduationCap } from 'lucide-react';

type Props = {
  userId: string;
};

export default function Hero({ userId }: Props) {
  const { isLoading, student, scores } = useUserStudent();

  if (isLoading) return <HeroSkeleton />;
  if (!student) return <StudentNotFound userId={userId} />;

  return (
    <Card>
      <CardHeader className='items-start border-b border-border/10 pb-8'>
        <CardTitle className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {student.name}
        </CardTitle>
        <div className='flex flex-col items-start space-y-1'>
          <Badge
            variant='secondary'
            className='flex items-center gap-2 rounded-full'
          >
            <GraduationCap className='size-5' />
            {
              student.programs.find((it) => it.status === 'Active')?.structure
                .program.name
            }
          </Badge>
          <div className='flex items-center gap-2 pl-2 text-sm text-muted-foreground/80'>
            {formatSemester(student.sem)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-6'>
          <div className='rounded-xl border bg-muted p-5 shadow transition-all hover:shadow-lg dark:border-none dark:bg-muted/30 sm:p-6'>
            <h3 className='text-sm font-medium text-muted-foreground'>CGPA</h3>
            <div className='mt-3 flex items-baseline'>
              <span className='text-2xl font-bold tracking-tight sm:text-4xl'>
                {scores?.cgpa.toFixed(2)}
              </span>
              <span className='ml-2 text-sm text-muted-foreground'>/ 4.0</span>
            </div>
          </div>
          <div className='rounded-xl border bg-muted p-5 shadow transition-all hover:shadow dark:border-none dark:bg-muted/30 sm:p-6'>
            <h3 className='text-sm font-medium text-muted-foreground'>
              Credits
            </h3>
            <div className='mt-3 flex items-baseline'>
              <span className='text-2xl font-bold tracking-tight sm:text-4xl'>
                {scores?.creditsCompleted.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroSkeleton() {
  return (
    <Card>
      <CardHeader className='items-start border-b border-border/10 pb-8'>
        <Skeleton className='h-10 w-64 sm:h-12' />
        <div className='flex flex-col items-start space-y-1'>
          <Skeleton className='h-7 w-40 rounded-full' />
          <Skeleton className='ml-2 h-4 w-32' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-6'>
          <div className='rounded-xl border bg-muted p-5 shadow dark:border-none dark:bg-muted/30 sm:p-6'>
            <Skeleton className='h-4 w-16' />
            <div className='mt-3 flex items-baseline'>
              <Skeleton className='h-8 w-16 sm:h-12' />
              <Skeleton className='ml-2 h-4 w-12' />
            </div>
          </div>
          <div className='rounded-xl border bg-muted p-5 shadow dark:border-none dark:bg-muted/30 sm:p-6'>
            <Skeleton className='h-4 w-16' />
            <div className='mt-3 flex items-baseline'>
              <Skeleton className='h-8 w-12 sm:h-12' />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentNotFound({ userId }: { userId?: string }) {
  return (
    <Container width='lg' className='pt-4 sm:pt-28'>
      <div className='mx-auto max-w-md py-10 text-center'>
        <AlertCircle className='mx-auto mb-4 size-16' />
        <h2 className='mb-4 text-3xl font-bold'>Student Not Found</h2>
        <p className='mb-6'>User ID: {userId}</p>
      </div>
    </Container>
  );
}
