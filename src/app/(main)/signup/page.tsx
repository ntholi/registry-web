import React from 'react';
import { auth } from '@/auth';
import { SignupForm } from '@/app/(main)/signup/signup-form';
import { getSignup } from '@/server/signups/actions';
import { redirect } from 'next/navigation';
import { Container } from '@/components/ui/container';
import Logo from '../base/Logo';
import { dashboardUsers } from '@/db/schema';

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

  const existingSignup = await getSignup(session.user.id);

  return (
    <>
      <Container className='flex h-screen w-full flex-col items-center justify-center gap-4'>
        <Logo width={200} height={200} />
        <div className='text-center'>
          <h1 className='text-3xl font-semibold sm:text-4xl'>Sign Up</h1>
          <p className='mt-1.5 text-muted-foreground'>
            Fill in your details to signup as a student
          </p>
        </div>
        <SignupForm existingSignup={existingSignup} />
      </Container>
    </>
  );
}
