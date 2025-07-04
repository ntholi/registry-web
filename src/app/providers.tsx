'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
