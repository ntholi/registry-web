import Gradient from '@/components/ui/gradient';
import { Toaster } from '@/components/ui/toaster';
import { PropsWithChildren } from 'react';
import Footer from './base/Footer';
import './globals.css';
import Providers from './providers';

export default async function MainLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <Gradient className='min-h-screen'>{children}</Gradient>
      <Footer />
      <Toaster />
    </Providers>
  );
}
