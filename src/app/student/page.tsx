import { Container } from '@mantine/core';
import Hero from './home/Hero';
import ActionButtons from './home/ActionButtons';

export default function page() {
  return (
    <Container size='md'>
      <Hero />
      <ActionButtons />
    </Container>
  );
}
