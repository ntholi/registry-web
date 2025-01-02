'use client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import React from 'react';
import { AppProgressBar } from 'next-nprogress-bar';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider defaultColorScheme='auto'>
      <Notifications />
      <ModalsProvider>
        {children}{' '}
        <AppProgressBar
          height='3px'
          color='#2196F3'
          options={{ showSpinner: false }}
          shallowRouting
        />
      </ModalsProvider>
    </MantineProvider>
  );
}
