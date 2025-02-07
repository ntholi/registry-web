import React from 'react';
import { auth } from '@/auth';
import { SignupForm } from '@/app/(main)/signup/signup-form';
import { getSignup } from '@/server/signups/actions';
import { redirect } from 'next/navigation';
import { Container } from '@/components/ui/container';

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
    <Container className='flex items-center justify-center flex-col w-full h-screen'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Sign Up</h1>
        <p className='text-muted-foreground'>
          Fill in your details to signup as a student
        </p>
      </div>
      <SignupForm existingSignup={existingSignup} />
    </Container>
  );
}
