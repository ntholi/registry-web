import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { redirect } from 'next/navigation';
import React from 'react';
import ClearanceRequestForm from './form';
import { getCurrentTerm } from '@/server/terms/actions';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';

export default async function Page() {
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
    <Container width='sm' className='pt-4 sm:pt-10'>
      <ClearanceRequestForm
        stdNo={session.user.stdNo}
        registrationRequestId={request.id}
        term={term}
      />
    </Container>
  );
}
