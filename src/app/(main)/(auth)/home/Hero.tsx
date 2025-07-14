import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSemester } from '@/lib/utils';
import { getStudentByUserId } from '@/server/students/actions';
import { GraduationCap } from 'lucide-react';
import { getStudentScore } from './actions/scores';

type Props = {
  student: NonNullable<Awaited<ReturnType<typeof getStudentByUserId>>>;
};

export default async function Hero({ student }: Props) {
  const scores = await getStudentScore(student);

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
