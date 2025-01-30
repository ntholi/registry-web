import { auth } from '@/auth';
import { Container } from '@/components/ui/container';
import { getStudentByUserId } from '@/server/students/actions';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function ClearancePage() {
  const session = await auth();
  const student = await getStudentByUserId(session?.user?.id);

  if (!student) {
    redirect('/register');
  }
  return (
    <Container>
      <div>ClearancePage</div>
    </Container>
  );
}
