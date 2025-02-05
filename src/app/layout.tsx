import { PropsWithChildren } from 'react';
import Providers from './providers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Portal',
  description:
    'Student Portal Limkokwing University of Creative Technology, Lesotho',
  icons: {
    icon: '/images/logo.png',
  },
  openGraph: {
    images: [
      {
        url: '/images/logo.png',
        width: 1371,
        height: 691,
      },
    ],
  },
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
