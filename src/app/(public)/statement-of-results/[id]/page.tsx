import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { getStatementOfResultsPrint } from '@/server/statement-of-results-prints/actions';
import { notFound } from 'next/navigation';
import Logo from '@/app/(main)/base/Logo';
import { GraduationCap, BookOpen } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StatementOfResultsPage({ params }: Props) {
  const { id } = await params;
  const statementPrint = await getStatementOfResultsPrint(id);

  if (!statementPrint) {
    return notFound();
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-muted/20'>
      <div className='container mx-auto max-w-4xl px-6 py-8'>
        <div className='mb-8 text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo width={120} height={120} />
          </div>
          <h1 className='mb-2 text-3xl font-bold text-foreground'>
            Statement of Results
          </h1>
          <p className='text-muted-foreground'>Official Academic Record</p>
        </div>
        <div className='space-y-6'>
          <Card className='overflow-hidden border-0 shadow-lg'>
            <div className='border-b bg-muted/50 px-6 py-4'>
              <h2 className='text-xl font-semibold text-foreground'>
                Student Information
              </h2>
            </div>
            <CardContent className='p-6'>
              <div className='grid gap-6 md:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Student Number
                  </label>
                  <p className='font-mono text-lg font-semibold text-foreground'>
                    {statementPrint.stdNo}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Student Name
                  </label>
                  <p className='text-lg font-semibold text-foreground'>
                    {statementPrint.studentName}
                  </p>
                </div>
              </div>
              <div className='mt-6'>
                <label className='text-sm font-medium text-muted-foreground'>
                  Program of Study
                </label>
                <p className='text-lg font-medium text-foreground'>
                  {statementPrint.programName}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className='overflow-hidden border-0 shadow-lg'>
            <div className='border-b bg-muted/50 px-6 py-4'>
              <h2 className='text-xl font-semibold text-foreground'>
                Academic Performance
              </h2>
            </div>
            <CardContent className='p-6'>
              <div className='grid gap-6 md:grid-cols-2'>
                <div className='rounded-lg bg-muted p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Total Credits
                      </p>
                      <p className='text-2xl font-bold text-foreground'>
                        {statementPrint.totalCredits}
                      </p>
                    </div>
                    <BookOpen className='h-8 w-8 text-muted-foreground' />
                  </div>
                </div>
                <div className='rounded-lg bg-muted p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Total Modules
                      </p>
                      <p className='text-2xl font-bold text-foreground'>
                        {statementPrint.totalModules}
                      </p>
                    </div>
                    <BookOpen className='h-8 w-8 text-muted-foreground' />
                  </div>
                </div>
              </div>
              <div className='mt-6 grid gap-6 md:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Cumulative GPA
                  </label>
                  {statementPrint.cgpa ? (
                    <div className='flex items-center gap-3'>
                      <span className='text-3xl font-bold text-foreground'>
                        {statementPrint.cgpa.toFixed(2)}
                      </span>
                      <div
                        className={`h-3 w-3 rounded-full ${
                          statementPrint.cgpa >= 3.5
                            ? 'bg-green-500'
                            : statementPrint.cgpa >= 2.5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                    </div>
                  ) : (
                    <p className='text-lg italic text-muted-foreground'>
                      Not calculated
                    </p>
                  )}
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Classification
                  </label>
                  {statementPrint.classification ? (
                    <Badge variant='outline' className='mt-1'>
                      {statementPrint.classification}
                    </Badge>
                  ) : (
                    <p className='text-lg italic text-muted-foreground'>
                      Not assigned
                    </p>
                  )}
                </div>
              </div>
              <div className='mt-6 grid gap-6 md:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Academic Status
                  </label>
                  {statementPrint.academicStatus ? (
                    <Badge variant='outline' className='mt-1'>
                      {statementPrint.academicStatus}
                    </Badge>
                  ) : (
                    <p className='text-lg italic text-muted-foreground'>
                      Not specified
                    </p>
                  )}
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Graduation Date
                  </label>
                  {statementPrint.graduationDate ? (
                    <div className='flex items-center gap-2'>
                      <GraduationCap className='h-4 w-4 text-muted-foreground' />
                      <span className='text-lg font-medium text-foreground'>
                        {statementPrint.graduationDate}
                      </span>
                    </div>
                  ) : (
                    <p className='text-lg italic text-muted-foreground'>
                      Not graduated
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className='overflow-hidden border-0 shadow-lg'>
            <div className='border-b bg-muted/50 px-6 py-4'>
              <h2 className='text-xl font-semibold text-foreground'>
                Print Information
              </h2>
            </div>
            <CardContent className='p-6'>
              <div className='grid gap-6 md:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Printed By
                  </label>
                  <p className='text-lg font-medium text-foreground'>
                    {statementPrint.printedBy || 'System Generated'}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Print Date & Time
                  </label>
                  <p className='text-lg font-medium text-foreground'>
                    {formatDateTime(statementPrint.printedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className='mt-8 text-center'>
            <div className='mx-auto mb-4 h-px w-32 bg-border' />
            <p className='text-sm text-muted-foreground'>
              This is an official statement of academic results
            </p>
            <p className='text-xs text-muted-foreground'>
              Generated by Limkokwing University Registry System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
