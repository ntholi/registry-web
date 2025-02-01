import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { registrationClearances } from '@/db/schema';
import { ArrowLeftIcon, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-500/15 text-green-700 hover:bg-green-500/25';
    case 'rejected':
      return 'bg-red-500/15 text-red-700 hover:bg-red-500/25';
    case 'pending':
    default:
      return 'bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25';
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
      return <CheckCircle2 className='h-5 w-5 text-green-600' />;
    case 'rejected':
      return <XCircle className='h-5 w-5 text-red-600' />;
    case 'pending':
    default:
      return <Clock className='h-5 w-5 text-yellow-600' />;
  }
}

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

  // Get clearances for this registration request
  const clearances = await db.query.registrationClearances.findMany({
    where: eq(registrationClearances.registrationRequestId, request.id),
    with: {
      clearedBy: true,
    },
  });

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
              <div>
                <CardTitle>Registration Status</CardTitle>
                <CardDescription>
                  Your registration request for {term.name}
                </CardDescription>
              </div>
              <Badge
                className={getStatusColor(request.status)}
                variant='outline'
              >
                {request.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            {request.message && (
              <div className='rounded-lg bg-muted p-4'>
                <p className='text-sm text-muted-foreground'>
                  {request.message}
                </p>
              </div>
            )}

            <div>
              <h3 className='font-semibold mb-3'>Registered Modules</h3>
              <div className='grid gap-3'>
                {request.requestedModules?.map((rm) => (
                  <div
                    key={rm.id}
                    className='flex items-center justify-between p-3 rounded-lg border'
                  >
                    <div>
                      <p className='font-medium'>{rm.module.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {rm.module.code}
                      </p>
                    </div>
                    <Badge variant='secondary'>{rm.moduleStatus}</Badge>
                  </div>
                ))}
              </div>
            </div>
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
                      <p className='font-medium capitalize'>
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
                  <Badge
                    className={getStatusColor(clearance.status)}
                    variant='outline'
                  >
                    {clearance.status}
                  </Badge>
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
