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
  CircleAlert,
  CircleCheck,
  EyeIcon,
  Info,
  PenSquare,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import StatusBadge from './components/StatusBadge';

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

          {request.status !== 'approved' && (
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
                <h3 className='text-lg font-semibold'>Requested Modules</h3>
              </div>
              <div className='grid gap-3'>
                {request.requestedModules?.map((rm) => (
                  <div
                    key={rm.id}
                    className='flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5'
                  >
                    <div>
                      <p className='font-medium'>{rm.module.name}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {rm.module.code}
                      </p>
                    </div>
                    <Badge
                      variant='secondary'
                      className='ml-4 whitespace-nowrap'
                    >
                      {rm.moduleStatus}
                    </Badge>
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
  status: 'pending' | 'approved' | 'registered' | 'rejected';
};

function StatusMessage({ message, status }: StatusBadgeProps) {
  const config = {
    pending: {
      className: 'border-amber-500/50 text-amber-600 dark:text-amber-400',
      icon: TriangleAlert,
      defaultMessage:
        'Your registration request is currently under review, this might take a few days. Come back later to check the status.',
    },
    approved: {
      className: 'border-blue-500/50 text-blue-600 dark:text-blue-400',
      icon: Info,
      defaultMessage:
        'Your registration request has been approved. Please wait while we process your registration.',
    },
    registered: {
      className: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400',
      icon: CircleCheck,
      defaultMessage:
        'Registration successful. You are now officially registered for the selected modules.',
    },
    rejected: {
      className: 'border-red-500/50 text-red-600 dark:text-red-400',
      icon: CircleAlert,
      defaultMessage:
        'Your registration request has been rejected. Click "View Full Details" for more information.',
    },
  };

  const currentConfig = config[status] || config.pending;
  const Icon = currentConfig.icon;

  return (
    <div className={`rounded-lg border p-6 ${currentConfig.className}`}>
      <p className='text-sm'>
        <Icon
          className='-mt-0.5 me-3 inline-flex opacity-60'
          size={16}
          strokeWidth={2}
          aria-hidden='true'
        />
        {status === 'rejected'
          ? message || currentConfig.defaultMessage
          : currentConfig.defaultMessage}
      </p>
    </div>
  );
}
