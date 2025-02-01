import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import Dashboard from './dashboard';
import Providers from './providers';
import React, { PropsWithChildren } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Registry Portal',
};

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <Dashboard>{children}</Dashboard>
    </Providers>
  );
}
