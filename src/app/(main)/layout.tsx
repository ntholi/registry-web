import Gradient from '@/components/ui/gradient';
import { Toaster } from '@/components/ui/toaster';
import { PropsWithChildren } from 'react';
import Footer from './base/Footer';
import './globals.css';
import Providers from './providers';

export default async function MainLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <Gradient className='min-h-[calc(100vh)] pb-8'>{children}</Gradient>
      <Footer />
      <Toaster />
    </Providers>
  );
}
