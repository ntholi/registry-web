import React, { PropsWithChildren } from 'react';
import Navbar from '../base/Navbar';

export default function layout({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
