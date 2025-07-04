import { FieldView } from '@/components/adease';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { getStatementOfResultsPrint } from '@/server/statement-of-results-prints/actions';
import { notFound } from 'next/navigation';

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
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <div className='space-y-6'>
        <div className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Statement of Results Print
          </h1>
          <p className='text-sm text-gray-600'>Print ID: {statementPrint.id}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Student Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FieldView label='Student Number'>
                <Badge variant='outline' className='px-3 py-1 text-lg'>
                  {statementPrint.stdNo}
                </Badge>
              </FieldView>
              <FieldView label='Student Name'>
                <span className='text-lg font-semibold'>
                  {statementPrint.studentName}
                </span>
              </FieldView>
            </div>

            <FieldView label='Program'>
              <span className='text-lg font-medium'>
                {statementPrint.programName}
              </span>
            </FieldView>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Academic Performance</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FieldView label='Total Credits'>
                <Badge variant='secondary' className='px-3 py-1 text-lg'>
                  {statementPrint.totalCredits}
                </Badge>
              </FieldView>
              <FieldView label='Total Modules'>
                <Badge variant='secondary' className='px-3 py-1 text-lg'>
                  {statementPrint.totalModules}
                </Badge>
              </FieldView>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FieldView label='CGPA'>
                {statementPrint.cgpa ? (
                  <Badge
                    variant={
                      statementPrint.cgpa >= 3.5
                        ? 'default'
                        : statementPrint.cgpa >= 2.5
                          ? 'secondary'
                          : 'destructive'
                    }
                    className='px-3 py-1 text-lg'
                  >
                    {statementPrint.cgpa.toFixed(2)}
                  </Badge>
                ) : (
                  <span className='text-gray-500'>Not calculated</span>
                )}
              </FieldView>
              <FieldView label='Classification'>
                {statementPrint.classification ? (
                  <Badge variant='outline' className='px-3 py-1 text-lg'>
                    {statementPrint.classification}
                  </Badge>
                ) : (
                  <span className='text-gray-500'>Not assigned</span>
                )}
              </FieldView>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FieldView label='Academic Status'>
                {statementPrint.academicStatus ? (
                  <Badge variant='outline' className='px-3 py-1 text-lg'>
                    {statementPrint.academicStatus}
                  </Badge>
                ) : (
                  <span className='text-gray-500'>Not specified</span>
                )}
              </FieldView>
              <FieldView label='Graduation Date'>
                {statementPrint.graduationDate ? (
                  <span className='font-medium'>
                    {statementPrint.graduationDate}
                  </span>
                ) : (
                  <span className='text-gray-500'>Not graduated</span>
                )}
              </FieldView>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Print Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FieldView label='Printed By'>
                <span className='font-medium'>
                  {statementPrint.printedBy || 'Unknown'}
                </span>
              </FieldView>
              <FieldView label='Printed At'>
                <span className='font-medium'>
                  {formatDateTime(statementPrint.printedAt)}
                </span>
              </FieldView>
            </div>
          </CardContent>
        </Card>

        <div className='pt-4 text-center text-sm text-gray-500'>
          <p>
            This document represents a printed statement of results for academic
            records.
          </p>
        </div>
      </div>
    </div>
  );
}
