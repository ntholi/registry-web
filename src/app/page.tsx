import { Suspense } from 'react';
import { auth } from '@/auth';
import { dashboardUsers } from '@/db/schema';
import { redirect } from 'next/navigation';
import { Center, Loader, Stack, Text } from '@mantine/core';

function LoadingComponent() {
  return (
    <Center h='100vh'>
      <Stack align='center' gap='1rem'>
        <Loader size='2rem' c='blue' />
        <Text size='0.875rem' c='dimmed'>
          Verifying authentication...
        </Text>
      </Stack>
    </Center>
  );
}

async function AuthHandler() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;

    if (role === 'student') {
      redirect('/student');
    } else if (role !== 'user' && [...dashboardUsers].includes(role)) {
      redirect('/dashboard');
    } else {
      redirect('/account-setup');
    }
  } else {
    redirect('/login');
  }

  return null;
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <AuthHandler />
    </Suspense>
  );
}
