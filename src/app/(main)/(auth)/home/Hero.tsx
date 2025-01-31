'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSemester } from '@/lib/utils';
import { getStudentByUserId } from '@/server/students/actions';
import { getStudentScore } from './actions';
import { GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudentByUserId>>>;
};

export default function Hero({ student }: Props) {
  const { data: scores } = useQuery({
    queryKey: ['student-scores', student.stdNo],
    queryFn: () => getStudentScore(student.stdNo),
    staleTime: 1000 * 60 * 5, // 5 minutes
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
          <div className='rounded-xl bg-muted/30 p-6 shadow-sm transition-all hover:shadow'>
            <h3 className='text-sm font-medium text-muted-foreground'>CGPA</h3>
            <div className='mt-3 flex items-baseline'>
              <span className='text-4xl font-bold tracking-tight'>
                {scores?.cgpa.toFixed(2)}
              </span>
              <span className='ml-2 text-sm text-muted-foreground'>/ 4.0</span>
            </div>
          </div>
          <div className='rounded-xl bg-muted/30 p-6 shadow-sm transition-all hover:shadow'>
            <h3 className='text-sm font-medium text-muted-foreground'>
              Total Credits
            </h3>
            <div className='mt-3 flex items-baseline'>
              <span className='text-4xl font-bold tracking-tight'>
                {scores?.creditsEarned}
              </span>
              <span className='ml-2 text-sm text-muted-foreground'>
                / {scores?.requiredCredits ?? 120}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
