import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { BookOpen, Calendar, EyeIcon, PenSquare } from 'lucide-react';
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
        <CardHeader className='pb-4'>
          <div className='flex flex-col space-y-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div>
                <CardTitle className='text-2xl font-bold'>
                  Registration Status
                </CardTitle>
                <div className='flex items-center mt-2 text-muted-foreground'>
                  <Calendar className='h-4 w-4 mr-2' />
                  <CardDescription className='text-sm'>
                    {term.name}
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status={request.status} />
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
          </div>
        </CardHeader>

        <CardContent>
          <div className='space-y-8'>
            {request.message && (
              <div className='rounded-lg bg-muted/50 p-6 border'>
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {request.message}
                </p>
              </div>
            )}

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
