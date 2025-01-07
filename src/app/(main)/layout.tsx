import Navbar from './base/Navbar';
import './globals.css';
import { PropsWithChildren } from 'react';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
