import { Space } from '@mantine/core';
import React from 'react';
import Navbar from './base/Navbar';
import Footer from './base/Footer';

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <Space h='xl' />
      <div style={{ minHeight: '80vh' }}>{children}</div>
      <Footer />
    </>
  );
}
