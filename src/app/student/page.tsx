import React from 'react';
import Hero from './home/Hero';
import { Container } from '@mantine/core';
import ActionButtons from './home/ActionButtons';

export default function page() {
  return (
    <Container size='md'>
      <Hero />
      <ActionButtons />
    </Container>
  );
}
