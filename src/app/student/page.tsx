import { Container } from '@mantine/core';
import Hero from './home/Hero';
import ActionButtons from './home/ActionButtons';
import Countdown from './home/Countdown';

export default function page() {
  const targetDate = new Date('2025-08-06T22:00:00').getTime();

  if (
    !process.env.AUTH_URL?.includes('localhost') &&
    targetDate > new Date().getTime()
  ) {
    return (
      <Container size='md'>
        <Countdown targetDate={targetDate} />
      </Container>
    );
  }

  return (
    <Container size='md'>
      <Hero />
      <ActionButtons />
    </Container>
  );
}
