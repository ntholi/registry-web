import React, { PropsWithChildren } from 'react';
import Navbar from '../base/Navbar';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { dashboardUsers } from '@/db/schema';

export default async function layout({ children }: PropsWithChildren) {
  const session = await auth();

  if (session?.user?.role === 'user') {
    redirect('/register');
  }

  if (session?.user?.role && dashboardUsers.includes(session.user.role)) {
    redirect('/admin');
  }
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
