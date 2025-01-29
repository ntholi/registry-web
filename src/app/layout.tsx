import { PropsWithChildren } from 'react';
import Providers from './providers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Portal',
  description:
    'Student Portal App for Limkokwing University of Creative Technology',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en'>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
