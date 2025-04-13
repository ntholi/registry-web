import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import {
  BookOpen,
  Calendar,
  CircleCheck,
  EyeIcon,
  PenSquare,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import StatusBadge, { getStatusStyles } from './components/StatusBadge';

export default async function RegistrationStatusPage() {
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

  return (
    <Container className='max-w-4xl pt-4 sm:pt-10'>
      <Card className='shadow-lg'>
        <CardHeader className='gap-6 pb-4'>
          <div>
            <div className='flex justify-between'>
              <CardTitle className='text-xl font-bold sm:text-2xl'>
                Registration Status
              </CardTitle>
              <StatusBadge status={request.status} />
            </div>
            <div className='mt-2 flex items-center text-muted-foreground'>
              <Calendar className='mr-2 h-4 w-4' />
              <p className='text-sm text-muted-foreground'>Term: {term.name}</p>
            </div>
          </div>

          {request.status !== 'registered' && (
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <Button
                variant='default'
                size='lg'
                asChild
                className='w-full sm:w-auto'
              >
                <Link
                  href='/registration/status'
                  className='flex items-center justify-center'
                >
                  <EyeIcon className='mr-2 h-5 w-5' />
                  View Full Details
                </Link>
              </Button>
              <Button
                variant='outline'
                size='lg'
                asChild
                className='w-full sm:w-auto'
              >
                <Link
                  href='/registration/update'
                  className='flex items-center justify-center'
                >
                  <PenSquare className='mr-2 h-5 w-5' />
                  Update Modules
                </Link>
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className='space-y-8'>
            <StatusMessage status={request.status} message={request.message} />

            <div>
              <div className='mb-4 flex items-center gap-2'>
                <BookOpen className='h-5 w-5 text-primary' />
                <h3 className='text-lg font-semibold'>
                  {request.status === 'registered'
                    ? 'Registered Modules'
                    : 'Requested Modules'}
                </h3>
              </div>
              <div className='grid gap-3'>
                {request.requestedModules?.map((rm) => (
                  <div
                    key={rm.id}
                    className='flex items-end justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5'
                  >
                    <div>
                      <p className='font-medium'>
                        {rm?.semesterModule?.module?.name}
                      </p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {rm?.semesterModule?.module?.code}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={
                          rm.status === 'registered' ? 'success' : 'secondary'
                        }
                        className='flex items-center gap-1'
                      >
                        {rm.status === 'registered' && (
                          <CircleCheck className='size-3' />
                        )}
                        {rm.status.charAt(0).toUpperCase() + rm.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

type StatusBadgeProps = {
  message: string | null;
  status: 'pending' | 'approved' | 'registered' | 'rejected' | 'partial';
};

function StatusMessage({ message, status }: StatusBadgeProps) {
  const styles = getStatusStyles(status);
  const Icon = styles.icon;

  const defaultMessages = {
    pending:
      'Your registration request is currently under review, this might take a few days. Come back later to check the status.',
    approved:
      'Your registration request has been approved. Please wait while we process your registration.',
    registered:
      'Registration successful. You are now officially registered for the selected modules.',
    rejected:
      'Your registration request has been rejected. Click "View Full Details" for more information.',
    partial:
      'Your registration request has been partially processed. Some modules are pending approval.',
  };

  const defaultMessage = defaultMessages[status] || defaultMessages.pending;

  return (
    <div className={`rounded-lg border p-6 ${styles.className}`}>
      <p className='text-sm'>
        <Icon
          className='-mt-0.5 me-3 inline-flex opacity-60'
          size={16}
          strokeWidth={2}
          aria-hidden='true'
        />
        {status === 'rejected' ? message || defaultMessage : defaultMessage}
      </p>
    </div>
  );
}
