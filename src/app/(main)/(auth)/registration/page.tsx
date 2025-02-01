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
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { EyeIcon } from 'lucide-react';
import StatusBadge from './components/StatusBadge';

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

  return (
    <Container className='pt-4 sm:pt-10'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl'>Registration Status</CardTitle>
              <CardDescription>
                Your current registration status for {term.name}
              </CardDescription>
            </div>
            <StatusBadge status={request.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {request.message && (
              <div className='rounded-lg bg-muted p-4'>
                <p className='text-sm text-muted-foreground'>
                  {request.message}
                </p>
              </div>
            )}

            <div>
              <h3 className='font-semibold mb-3'>Registered Modules</h3>
              <div className='space-y-2'>
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

            <Separator />

            <div className='flex justify-end'>
              <Button asChild>
                <Link href='/registration/status'>
                  <EyeIcon className='mr-2 h-4 w-4' />
                  View Full Details
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
