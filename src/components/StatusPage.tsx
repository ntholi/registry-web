'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Center,
  Container,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import React from 'react';
import { IconArrowLeft } from '@tabler/icons-react';

export interface StatusPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  showBack?: boolean;
}

export default function StatusPage({
  title,
  description,
  icon,
  color = 'blue',
  primaryActionHref = '/',
  primaryActionLabel = 'Go home',
  showBack = true,
}: StatusPageProps) {
  const router = useRouter();

  return (
    <Center h='100dvh'>
      <Container size='xs'>
        <Stack align='center' gap='md'>
          {icon ? (
            <ThemeIcon size={64} radius='xl' variant='light' color={color}>
              {icon}
            </ThemeIcon>
          ) : null}
          <Title order={1} ta='center' size='h2'>
            {title}
          </Title>
          {description ? (
            <Text c='dimmed' ta='center'>
              {description}
            </Text>
          ) : null}
          <Group mt='sm'>
            {showBack ? (
              <Button
                variant='light'
                color={color}
                leftSection={<IconArrowLeft size='1.2rem' />}
                onClick={() => router.back()}
              >
                Go back
              </Button>
            ) : null}
            <Button component={Link} href={primaryActionHref} color={color}>
              {primaryActionLabel}
            </Button>
          </Group>
        </Stack>
      </Container>
    </Center>
  );
}
