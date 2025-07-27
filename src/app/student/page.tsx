import { Container } from '@mantine/core';
import ActionButtons from './home/ActionButtons';
import Hero from './home/Hero';

export default function page() {
  return (
    <Container size='md'>
      <Hero />
      <ActionButtons />
    </Container>
  );
}
