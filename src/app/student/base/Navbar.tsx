import Logo from '@/components/Logo'
import { Box, Divider, Group } from '@mantine/core'
import React from 'react'

export default function Navbar() {
  return (
    <>
      <Box p={5}>
        <Logo />
      </Box>
      <Divider />
    </>
  )
}
