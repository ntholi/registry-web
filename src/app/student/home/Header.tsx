'use client';
import useUserStudent from '@/hooks/use-user-student';
import { Paper } from '@mantine/core';
import React from 'react';

export default function Header() {
  const { student } = useUserStudent();
  return (
    <Paper withBorder p='xl' radius='md'>
      Header
    </Paper>
  );
}
