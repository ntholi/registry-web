import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { formatDate } from '@/lib/utils';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { ArrowLeftIcon, InfoIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import StatusBadge, { getStatusIcon } from '../components/StatusBadge';
import { getRegistrationClearances } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function page() {
  const session = await auth();

  if (!session?.user?.stdNo) {
    redirect('/signup');
  }

  const term = await getCurrentTerm();
  const request = await getRegistrationRequestByStdNo(
    session.user.stdNo,
    term.id
  );

  if (!request) {
    redirect('/registration/request');
  }
  const clearances = await getRegistrationClearances(request.id);

  return (
    <Container className='pt-4 sm:pt-10'>
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='icon' asChild>
            <Link href='/registration'>
              <ArrowLeftIcon className='h-4 w-4' />
            </Link>
          </Button>
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
              Your registration request for {term.name}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {request.message && (
              <Alert>
                <InfoIcon className='h-4 w-4' />
                <AlertTitle className='capitalize'>{request.status}</AlertTitle>
                <AlertDescription>{request.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

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
                  className='flex items-start justify-between p-4 rounded-lg border'
                >
                  <div className='flex gap-3'>
                    {getStatusIcon(clearance.status)}
                    <div>
                      <p className='font-medium text-sm sm:text-base capitalize'>
                        {clearance.department} Department
                      </p>
                      {clearance.message && (
                        <p className='text-sm text-muted-foreground mt-1'>
                          {clearance.message}
                        </p>
                      )}
                      {clearance.responseDate && (
                        <p className='text-xs text-muted-foreground mt-2'>
                          Responded on {formatDate(clearance.responseDate)}
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
          <p>Registration submitted on {formatDate(request.createdAt)}</p>
          {request.updatedAt && (
            <p>Last updated on {formatDate(request.updatedAt)}</p>
          )}
        </div>
      </div>
    </Container>
  );
}
