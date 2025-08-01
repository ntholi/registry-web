import { Space } from '@mantine/core';
import React from 'react';
import Navbar from './base/Navbar';
import Footer from './base/Footer';
import { Metadata } from 'next';
import { auth } from '@/auth';

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  return {
    title: session?.user?.name
      ? `${session.user.name.split(' ')[0]}'s Portal`
      : 'Student Portal',
    description:
      'Student Portal for Limkokwing University of Creative Technology, Lesotho',
  };
}
export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <Space h='xl' />
      <div style={{ minHeight: '80vh' }}>{children}</div>
      <Footer />
    </>
  );
}
