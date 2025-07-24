import React from 'react';
import Hero from './home/Hero';
import { Container } from '@mantine/core';

export default function page() {
  return (
    <Container size='md'>
      <Hero />
    </Container>
  );
}
