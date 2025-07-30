import { auth } from '@/auth';
import { toTitleCase } from '@/lib/utils';
import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import Dashboard from './dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  return {
    title: `${toTitleCase(session?.user?.role)} Portal | Limkokwing`,
  };
}

export default function AdminLayout({ children }: PropsWithChildren) {
  return <Dashboard>{children}</Dashboard>;
}
