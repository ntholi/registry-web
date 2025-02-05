'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSemester } from '@/lib/utils';
import { getStudentByUserId } from '@/server/students/actions';
import { getStudentScore } from './actions';
import { GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudentByUserId>>>;
};

export default function Hero({ student }: Props) {
  const { data: scores, isLoading } = useQuery({
    queryKey: ['studentScores', student.stdNo],
    queryFn: () => getStudentScore(student.stdNo, student.structureId!),
    enabled: !!student.structureId,
    staleTime: 1000 * 60 * 5,
  });

  return (
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
          <div className='rounded-xl bg-muted/30 p-5 sm:p-6 shadow-sm transition-all hover:shadow'>
            <h3 className='text-sm font-medium text-muted-foreground'>CGPA</h3>
            <div className='mt-3 flex items-baseline'>
              {isLoading ? (
                <Skeleton className='h-10 w-24' />
              ) : (
                <>
                  <span className='text-2xl sm:text-4xl font-bold tracking-tight'>
                    {scores?.gpa.toFixed(2)}
                  </span>
                  <span className='ml-2 text-sm text-muted-foreground'>
                    / 4.0
                  </span>
                </>
              )}
            </div>
          </div>
          <div className='rounded-xl bg-muted/30 p-5 sm:p-6 shadow-sm transition-all hover:shadow'>
            <h3 className='text-sm font-medium text-muted-foreground'>
              Total Credits
            </h3>
            <div className='mt-3 flex items-baseline'>
              {isLoading ? (
                <Skeleton className='h-10 w-24' />
              ) : (
                <>
                  <span className='text-2xl sm:text-4xl font-bold tracking-tight'>
                    {scores?.creditsCompleted.toFixed(0)}
                  </span>
                  <span className='ml-2 text-sm text-muted-foreground'>
                    / {scores?.creditsRequired.toFixed(0)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
