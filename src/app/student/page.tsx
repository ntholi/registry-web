'use client';

import useUserStudent from '@/hooks/use-user-student';
import { Center, Container, Loader } from '@mantine/core';
import ActionButtons from './home/ActionButtons';
import Hero from './home/Hero';

export default function Page() {
  const { program, semester, isLoading } = useUserStudent();

  if (isLoading) {
    return (
      <Center h='100vh' w='100vw'>
        <Loader />
      </Center>
    );
  }

  return (
    <Container size='md'>
      <Hero />
      <ActionButtons />
    </Container>
  );
}
