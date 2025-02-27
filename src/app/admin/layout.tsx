import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import Dashboard from './dashboard';
import Providers from './providers';
import React, { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { toTitleCase } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  return {
    title: `${toTitleCase(session?.user?.role)} Portal | Limkokwing`,
  };
}

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <Dashboard>{children}</Dashboard>
    </Providers>
  );
}
