'use client';

import useUserStudent from '@/hooks/use-user-student';
import { Center, Container, Loader, Text, Title } from '@mantine/core';
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

  const canRegister =
    [3, 4, 8, 10, 7, 15].includes(program?.schoolId ?? 0) ||
    [
      513, 500, 505, 498, 499, 484, 482, 528, 507, 531, 503, 534, 533, 485,
    ].includes(program?.structureId ?? 0);

  if (!canRegister && semester?.semesterNumber && semester.semesterNumber > 1) {
    return (
      <Container size='md'>
        <Title order={2} ta='center'>
          Registration Temporarily Unavailable
        </Title>
        <Text ta='center' mt='sm'>
          The system is currently open for selected faculties. You will be
          notified through SRC as soon as registration is ready for your
          faculty. We apologize for the inconvenience caused due to technical
          difficulties.
        </Text>
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
