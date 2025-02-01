import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  EyeIcon,
  PenSquare,
} from 'lucide-react'; // Add this import at the top with other imports
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
    term.id
  );

  if (!request) {
    redirect('/registration/request');
  }

  return (
    <Container className='max-w-4xl pt-4 sm:pt-10'>
      <Card className='shadow-lg'>
        <CardHeader className='pb-4 gap-6'>
          <div>
            <div className='flex justify-between'>
              <CardTitle className='text-xl sm:text-2xl font-bold'>
                Registration Status
              </CardTitle>
              <StatusBadge status={request.status} />
            </div>
            <div className='flex items-center mt-2 text-muted-foreground'>
              <Calendar className='h-4 w-4 mr-2' />
              <p className='text-sm text-muted-foreground'>Term: {term.name}</p>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row sm:justify-end gap-3'>
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
        </CardHeader>

        <CardContent>
          <div className='space-y-8'>
            <StatusMessage status={request.status} message={request.message} />

            <div>
              <div className='flex items-center gap-2 mb-4'>
                <BookOpen className='h-5 w-5 text-primary' />
                <h3 className='font-semibold text-lg'>Registered Modules</h3>
              </div>
              <div className='grid gap-3'>
                {request.requestedModules?.map((rm) => (
                  <div
                    key={rm.id}
                    className='flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors'
                  >
                    <div>
                      <p className='font-medium'>{rm.module.name}</p>
                      <p className='text-sm text-muted-foreground mt-1'>
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
  status: 'pending' | 'approved' | 'rejected';
};

function StatusMessage({ message, status }: StatusBadgeProps) {
  const config = {
    pending: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      icon: Clock,
      defaultMessage:
        'Your registration request is currently under review, this might take a few days. Come back later to check the status.',
    },
    approved: {
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-900 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
      icon: CheckCircle2,
      defaultMessage:
        'Your registration request has been approved. You are now officially registered for the selected modules.',
    },
    rejected: {
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: AlertTriangle,
      defaultMessage:
        'Your registration request has been rejected. Click "View Full Details" for more information.',
    },
  };

  const currentConfig = config[status] || config.pending;
  const Icon = currentConfig.icon;

  return (
    <div
      className={`rounded-lg ${currentConfig.bgColor} p-6 border-2 ${currentConfig.borderColor} shadow-sm`}
    >
      <div className='flex gap-3'>
        <Icon
          className={`h-5 w-5 ${currentConfig.iconColor} flex-shrink-0 mt-0.5`}
        />
        <p className={`text-sm ${currentConfig.textColor} leading-relaxed`}>
          {status === 'rejected'
            ? message || currentConfig.defaultMessage
            : currentConfig.defaultMessage}
        </p>
      </div>
    </div>
  );
}
