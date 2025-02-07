import React from 'react';
import { auth } from '@/auth';
import { SignupForm } from '@/app/(main)/signup/signup-form';
import { getSignup } from '@/server/signups/actions';
import { redirect } from 'next/navigation';
import { Container } from '@/components/ui/container';
import Logo from '../base/Logo';

export default async function SignupPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session?.user?.role === 'student') {
    redirect('/');
  }

  const existingSignup = await getSignup(session.user.id);

  return (
    <>
      <Logo
        width={300}
        height={300}
        className='absolute left-1/2 top-0 mt-4 h-20 sm:h-28 w-auto -translate-x-1/2 md:mt-5'
      />
      <Container className='flex items-center justify-center flex-col w-full h-screen gap-8 md:pt-10'>
        <div className='text-center'>
          <h1 className='text-3xl sm:text-4xl font-semibold'>Sign Up</h1>
          <p className='text-muted-foreground'>
            Fill in your details to signup as a student
          </p>
        </div>
        <SignupForm existingSignup={existingSignup} />
      </Container>
    </>
  );
}
