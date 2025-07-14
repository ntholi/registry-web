import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { dashboardUsers } from '@/db/schema';
import { redirect } from 'next/navigation';
import { AlertCircle, Mail } from 'lucide-react';
import Logo from '../base/Logo';
import LogoutButton from './LogoutButton';

export default async function SignupPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session?.user?.role === 'student') {
    redirect('/');
  } else if (
    session.user.role &&
    dashboardUsers.includes(
      session.user.role as (typeof dashboardUsers)[number],
    )
  ) {
    redirect('/admin');
  }

  return (
    <div className='min-h-screen'>
      <Container className='flex min-h-screen items-center justify-center px-4 py-12'>
        <div className='w-full max-w-md'>
          <div className='rounded-2xl border p-8 shadow-xl backdrop-blur-sm dark:bg-zinc-950'>
            <div className='flex flex-col items-center'>
              <div className='mb-6'>
                <Logo width={220} height={220} />
              </div>

              <h1 className='mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white'>
                Account Not Found
              </h1>
            </div>

            <div className='mt-5 space-y-6'>
              <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
                <div className='flex items-start space-x-3'>
                  <AlertCircle className='mt-0.5 size-5 text-amber-600 dark:text-amber-400' />
                  <div className='flex-1'>
                    <p className='text-sm text-amber-700 dark:text-amber-300'>
                      Your email is not associated with any account in our
                      system. Please consult registry office for assistance, or
                      log in with a different email.
                    </p>
                  </div>
                </div>
              </div>

              <div className='rounded-lg border p-4 dark:bg-zinc-900'>
                <div className='flex items-center space-x-3'>
                  <div className='flex items-center justify-center rounded-full border bg-zinc-800 p-3'>
                    <Mail className='size-4' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium'>Logged in as</p>
                    <p className='break-all text-sm'>{session.user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-8 flex justify-center'>
              <LogoutButton />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
