import { auth } from '@/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { formatDateTime, formatSemester } from '@/lib/utils';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { AlertCircleIcon, InfoIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import StatusBadge, { getStatusIcon } from '../components/StatusBadge';
import { getRegistrationClearances } from './actions';
import BackButton from './BackButton';

export default async function page() {
  const session = await auth();

  if (!session?.user?.stdNo) {
    redirect('/signup');
  }

  const term = await getCurrentTerm();
  const request = await getRegistrationRequestByStdNo(
    session.user.stdNo,
    term.id,
  );

  if (!request) {
    redirect('/registration/request');
  }
  const clearances = await getRegistrationClearances(request.id);

  const pendingDepartments = clearances
    .filter((clearance) => clearance.status !== 'approved')
    .map((clearance) => clearance.department);

  return (
    <Container className='pt-4 sm:pt-10'>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <BackButton />
          <div>
            <h1 className='text-2xl font-semibold'>Registration Details</h1>
            <p className='text-sm text-muted-foreground'>
              View your registration status and department clearances
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Registration Status</CardTitle>
              <StatusBadge status={request.status} />
            </div>
            <CardDescription>
              Your registration request for{' '}
              <span className='text-white'>
                {formatSemester(request.semesterNumber)}
              </span>
            </CardDescription>
          </CardHeader>
          {request.message && (
            <CardContent>
              <Alert>
                <InfoIcon className='h-4 w-4' />
                <AlertTitle className='capitalize'>{request.status}</AlertTitle>
                <AlertDescription>{request.message}</AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>
        {pendingDepartments.length > 0 && (
          <Alert className='border-amber-500 bg-amber-50 py-4 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'>
            <AlertCircleIcon className='h-5 w-5 text-amber-500' />
            <AlertTitle>Pending departmental clearance</AlertTitle>
            <AlertDescription className='text-amber-700 dark:text-amber-300'>
              Registration cannot proceed until cleared by:{' '}
              <span className='font-medium capitalize'>
                {pendingDepartments.join(', ')}
              </span>
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Department Clearances</CardTitle>
            <CardDescription>
              Status of your clearances from different departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              {clearances.map((clearance) => (
                <div
                  key={clearance.id}
                  className='flex items-start justify-between rounded-lg border p-4'
                >
                  <div className='flex gap-3'>
                    {getStatusIcon(clearance.status)}
                    <div>
                      <p className='text-sm font-medium capitalize sm:text-base'>
                        {clearance.department} Department
                      </p>
                      {clearance.message && (
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {clearance.message}
                        </p>
                      )}
                      {clearance.responseDate && (
                        <p className='mt-2 text-xs text-muted-foreground'>
                          Responded on {formatDateTime(clearance.responseDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={clearance.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className='text-center text-sm text-muted-foreground'>
          <p>Registration submitted on {formatDateTime(request.createdAt)}</p>
          {request.updatedAt && (
            <p>Last updated on {formatDateTime(request.updatedAt)}</p>
          )}
        </div>
      </div>
    </Container>
  );
}
