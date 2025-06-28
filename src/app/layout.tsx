import { PropsWithChildren } from 'react';
import Providers from './providers';
import { Metadata } from 'next';
import Maintenance from './Maintenance';

export const metadata: Metadata = {
  title: 'Registry Portal | Limkokwing',
  description:
    'Registry Portal for Limkokwing University of Creative Technology, Lesotho',
  keywords: [
    'Limkokwing Student Portal',
    'Student Portal',
    'Limkokwing Lesotho',
  ],
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
    <html lang='en' suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Maintenance />
        {/* <Providers>{children}</Providers> */}
      </body>
    </html>
  );
}
