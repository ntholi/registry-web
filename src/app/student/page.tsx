'use client';

import useUserStudent from '@/hooks/use-user-student';
import { Container } from '@mantine/core';
import ActionButtons from './home/ActionButtons';
import Countdown from './home/Countdown';
import Hero from './home/Hero';

export default function Page() {
  const { program, isLoading } = useUserStudent();
  const targetDate = new Date('2025-08-08T15:00:00').getTime();

  if (isLoading) {
    return (
      <Container size='md'>
        <div>Loading...</div>
      </Container>
    );
  }

  const shouldShowCountdown =
    targetDate > new Date().getTime() &&
    ![3, 4, 10].includes(program?.schoolId ?? 0);

  if (shouldShowCountdown) {
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
