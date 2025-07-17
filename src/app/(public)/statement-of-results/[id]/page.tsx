import Logo from '@/app/(main)/base/Logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { getStatementOfResultsPrint } from '@/server/statement-of-results-prints/actions';
import {
  BookOpen,
  CheckCircle,
  FileText,
  GraduationCap,
  User,
} from 'lucide-react';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StatementOfResultsPage({ params }: Props) {
  const { id } = await params;
  const item = await getStatementOfResultsPrint(id);

  if (!item) {
    return notFound();
  }

  return (
    <div className='min-h-screen'>
      <div className='container mx-auto max-w-3xl p-6 lg:p-8'>
        <header className='flex flex-col items-center text-center'>
          <Logo height={160} className='h-24 w-auto' />
          <div className='my-5 flex items-center justify-center gap-2'>
            <h1 className='text-3xl font-light tracking-tight'>
              Results Verification
            </h1>
          </div>
        </header>

        <Alert variant='default' className='mb-6 p-4'>
          <CheckCircle className='size-5' color='#4CAF50' />
          <AlertTitle>Authentic document</AlertTitle>
          <AlertDescription className='text-sm text-muted-foreground'>
            Please verify that the printed document matches the information
            below
          </AlertDescription>
        </Alert>

        <main className='space-y-6'>
          <Card className='border bg-card'>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg font-medium'>
                <User className='h-4 w-4' />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Student Number
                  </p>
                  <p className='font-medium'>{item.stdNo}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Student Name</p>
                  <p className='font-medium'>{item.studentName}</p>
                </div>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Program of Study
                </p>
                <p className='font-medium'>{item.programName}</p>
              </div>
            </CardContent>
          </Card>

          <Card className='border bg-card'>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg font-medium'>
                <BookOpen className='h-4 w-4' />
                Academic Summary
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-3 gap-4'>
                <Card className='border bg-muted/30'>
                  <CardContent className='p-4 text-center'>
                    <div className='text-2xl font-light'>
                      {item.cgpa ? item.cgpa : '—'}
                    </div>
                    <div className='text-sm text-muted-foreground'>CGPA</div>
                  </CardContent>
                </Card>
                <Card className='border bg-muted/30'>
                  <CardContent className='p-4 text-center'>
                    <div className='text-2xl font-light'>
                      {item.totalCredits}
                    </div>
                    <div className='text-sm text-muted-foreground'>Credits</div>
                  </CardContent>
                </Card>
                <Card className='border bg-muted/30'>
                  <CardContent className='p-4 text-center'>
                    <div className='text-2xl font-light'>
                      {item.totalModules}
                    </div>
                    <div className='text-sm text-muted-foreground'>Modules</div>
                  </CardContent>
                </Card>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <p className='mb-1 text-sm text-muted-foreground'>
                    Classification
                  </p>
                  {item.classification ? (
                    <Badge variant='secondary' className='font-normal'>
                      {item.classification}
                    </Badge>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      Not assigned
                    </p>
                  )}
                </div>
                <div>
                  <p className='mb-1 text-sm text-muted-foreground'>
                    Academic Status
                  </p>
                  {item.academicStatus ? (
                    <Badge variant='secondary' className='font-normal'>
                      {item.academicStatus}
                    </Badge>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      Not specified
                    </p>
                  )}
                </div>
              </div>

              {item.graduationDate && (
                <Card className='border bg-muted/20'>
                  <CardContent className='p-4'>
                    <div className='mb-1 flex items-center gap-2'>
                      <GraduationCap className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>
                        Graduation Date
                      </p>
                    </div>
                    <p className='font-medium'>{item.graduationDate}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className='border bg-card'>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg font-medium'>
                <FileText className='h-4 w-4' />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <p className='mb-1 text-sm text-muted-foreground'>
                    Print Date
                  </p>
                  <p className='font-medium'>
                    {formatDateTime(item.printedAt)}
                  </p>
                </div>
              </div>
              <Card className='border bg-muted/20'>
                <CardContent className='p-4'>
                  <p className='mb-1 text-sm text-muted-foreground'>
                    Verification ID
                  </p>
                  <p className='break-all font-mono text-sm text-muted-foreground'>
                    {item.id}
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </main>

        <footer className='mt-12 space-y-3 text-center'>
          <div className='mx-auto h-px w-16 bg-border' />
          <p className='text-sm text-muted-foreground'>
            This is an official statement of academic results
          </p>
          <p className='text-xs text-muted-foreground'>
            Generated by Limkokwing University Registry System
          </p>
        </footer>
      </div>
    </div>
  );
}
