import { auth } from '@/auth';
import {
  Box,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { forbidden } from 'next/navigation';
import { Suspense } from 'react';
import RegistrationHistory from './components/RegistrationHistory';
import RegistrationHistorySkeleton from './components/RegistrationHistorySkeleton';
import NewRegistrationCard from './components/NewRegistrationCard';
import NewRegistrationCardSkeleton from './components/NewRegistrationCardSkeleton';

export default async function page() {
  const session = await auth();

  if (!session?.user?.stdNo) {
    return forbidden();
  }

  return (
    <Container size='md'>
      <Stack gap='xl'>
        <Group justify='space-between' align='flex-start'>
          <Box>
            <Title order={1} size='h2' fw={600} mb='xs'>
              Registration Requests
            </Title>
            <Text c='dimmed' size='sm'>
              View and track all your registration requests and their current
              status
            </Text>
          </Box>
        </Group>

        <Suspense fallback={<NewRegistrationCardSkeleton />}>
          <NewRegistrationCard stdNo={session.user.stdNo!} />
        </Suspense>

        <Divider />

        <Suspense fallback={<RegistrationHistorySkeleton />}>
          <RegistrationHistory stdNo={session.user.stdNo!} />
        </Suspense>
      </Stack>
    </Container>
  );
}
