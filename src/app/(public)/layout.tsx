import '../(main)/globals.css';
import Gradient from '@/components/ui/gradient';
import { Toaster } from '@/components/ui/toaster';
import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import Providers from './providers';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Limkokwing University of Creative Technology`,
    description: 'Limkokwing Student Portal',
  };
}

export default async function MainLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <Gradient className='min-h-[calc(100vh)] pb-8'>{children}</Gradient>
      <Toaster />
    </Providers>
  );
}
