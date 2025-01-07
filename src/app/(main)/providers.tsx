'use client';

import { ThemeProvider } from '@/components/theme-provider';
import React from 'react';

type Props = {
  children: React.ReactNode;
};

export default function Providers({ children }: Props) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    mounted && (
      <ThemeProvider
        attribute='class'
        defaultTheme='dark'
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    )
  );
}
