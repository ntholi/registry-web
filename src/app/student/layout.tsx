import React from 'react'
import Navbar from './base/Navbar'

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
