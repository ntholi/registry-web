import Image from 'next/image';
import { Container, Center, Stack, Title, Text, Divider } from '@mantine/core';

export default function Maintenance() {
  return (
    <Container
      size='sm'
      style={{
        minHeight: '100vh',
      }}
    >
      <Center style={{ minHeight: '100vh' }}>
        <Stack align='center' gap='lg'>
          <div style={{ height: 160, overflow: 'hidden' }}>
            <Image
              src='/images/logo-dark.png'
              alt='Limkokwing Logo'
              width={160}
              height={160}
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'contain',
                padding: 'var(--mantine-spacing-md)',
              }}
              priority
            />
          </div>

          <Stack align='center' gap='md'>
            <Title
              order={2}
              style={{
                fontWeight: 300,
                letterSpacing: '0.025em',
                color: 'var(--mantine-color-white)',
                opacity: 0.9,
              }}
            >
              Back in 57 minutes
            </Title>

            <Divider
              size='xs'
              style={{
                width: 64,
                backgroundColor: 'var(--mantine-color-white)',
                opacity: 0.3,
              }}
            />

            <Text
              size='sm'
              style={{
                color: 'var(--mantine-color-white)',
                opacity: 0.6,
                textAlign: 'center',
              }}
            >
              We are currently performing maintenance on the system.
            </Text>
          </Stack>
        </Stack>
      </Center>
    </Container>
  );
}
