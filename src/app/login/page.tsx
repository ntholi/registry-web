import { auth, signIn } from '@/auth';
import Logo from '@/components/Logo';
import {
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconBrandGoogle, IconShield } from '@tabler/icons-react';
import { redirect } from 'next/navigation';

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
    <Box
      style={{
        minHeight: '100vh',
        background:
          'light-dark(linear-gradient(135deg, var(--mantine-color-blue-1) 0%, var(--mantine-color-indigo-1) 100%), linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-6) 100%))',
      }}
    >
      <Container size='sm' pt='3.75rem' pb='2.5rem'>
        <Center>
          <Paper
            shadow='xl'
            p='2.5rem'
            w='100%'
            maw='26.25rem'
            withBorder
            bg='light-dark(var(--mantine-color-white), var(--mantine-color-dark-8))'
            style={{
              backdropFilter: 'blur(10px)',
              borderColor:
                'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
            }}
          >
            <Stack align='center' gap='xl'>
              <Stack align='center' gap='md'>
                <Logo height={130} />
                <Stack align='center' gap='xs'>
                  <Title order={2} size='h1' fw={100} ta='center'>
                    Student Portal
                  </Title>
                </Stack>
              </Stack>

              <Stack w='100%' gap='lg'>
                <form action={handleGoogleSignIn}>
                  <Button
                    type='submit'
                    variant='gradient'
                    gradient={{ from: 'blue', to: 'indigo', deg: 45 }}
                    leftSection={<IconBrandGoogle size='1.125rem' />}
                    fullWidth
                    style={{
                      boxShadow:
                        'light-dark(0 4px 12px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(99, 179, 237, 0.4))',
                    }}
                  >
                    Sign in with Google
                  </Button>
                </form>

                <Group justify='center' gap='xs' mt='md'>
                  <IconShield
                    size={'1rem'}
                    color='light-dark(var(--mantine-color-green-6), var(--mantine-color-green-4))'
                  />
                  <Text size='xs' c='dimmed'>
                    Secure authentication powered by Google
                  </Text>
                </Group>

                <Stack gap='xs' mt='lg'>
                  <Group justify='center' gap='xs'>
                    <Text size='xs' c='dimmed'>
                      Need assistance?
                    </Text>
                    <Text
                      size='xs'
                      c='blue'
                      component='a'
                      href='mailto:registry@limkokwing.ac.ls'
                      style={{
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Contact Registry
                    </Text>
                  </Group>
                  <Text size='xs' c='dimmed' ta='center'>
                    Limkokwing University of Creative Technology, Lesotho
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </Center>
      </Container>
    </Box>
  );
}
