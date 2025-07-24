'use client';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import React from 'react';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MantineProvider defaultColorScheme='dark'>
        <Notifications />
        <ModalsProvider>
          <QueryClientProvider client={queryClient}>
            <NuqsAdapter>
              {children}
              <NextTopLoader
                height={3}
                color='#2196F3'
                showSpinner={false}
                shadow='0 0 10px #2196F3,0 0 5px #2196F3'
              />
            </NuqsAdapter>
          </QueryClientProvider>
        </ModalsProvider>
      </MantineProvider>
    </SessionProvider>
  );
}
