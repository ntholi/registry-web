import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Box,
  Divider,
  ThemeIcon,
  Group,
} from '@mantine/core';
import { IconBrandGoogle, IconSchool } from '@tabler/icons-react';
import Logo from '@/components/Logo';

async function handleGoogleSignIn() {
  'use server';
  await signIn('google', { redirectTo: '/' });
}

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;
    if (role === 'student') {
      redirect('/student');
    } else if (
      [
        'admin',
        'academic',
        'finance',
        'registry',
        'library',
        'resource',
      ].includes(role)
    ) {
      redirect('/dashboard');
    } else {
      redirect('/');
    }
  }

  return (
    <Container size='xs' h='100vh'>
      <Center h='100%'>
        <Paper shadow='md' p='xl' radius='md' w='100%' withBorder>
          <Stack align='center' gap='xl'>
            <Logo height={100} />

            <Divider w='100%' />

            <Stack w='100%' gap='lg'>
              <form action={handleGoogleSignIn}>
                <Button
                  type='submit'
                  variant='default'
                  leftSection={<IconBrandGoogle size='1.2rem' />}
                  fullWidth
                >
                  Continue with Google
                </Button>
              </form>

              <Stack gap='xs' mt='md'>
                <Group justify='center' gap='xs'>
                  <Text size='xs' c='dimmed'>
                    Need help?
                  </Text>
                  <Text
                    size='xs'
                    c='blue'
                    component='a'
                    href='mailto:registry@limkokwing.ac.ls'
                  >
                    Contact Registry
                  </Text>
                </Group>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Center>
    </Container>
  );
}
