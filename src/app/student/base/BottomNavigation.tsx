'use client';
import {
  ActionIcon,
  Paper,
  Group,
  Text,
  Stack,
  useMantineColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconHome,
  IconFileText,
  IconCertificate,
  IconUser,
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  path: string;
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const navItems: NavItem[] = useMemo(
    () => [
      {
        icon: <IconHome size={20} />,
        label: 'Home',
        href: '/student',
        path: '/student',
      },
      {
        icon: <IconFileText size={20} />,
        label: 'Registration',
        href: '/student/registration',
        path: '/student/registration',
      },
      {
        icon: <IconCertificate size={20} />,
        label: 'Transcript',
        href: '/student/transcripts',
        path: '/student/transcripts',
      },
      {
        icon: <IconUser size={20} />,
        label: 'Profile',
        href: '/student/profile',
        path: '/student/profile',
      },
    ],
    []
  );

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const isActive = (path: string) => {
    if (path === '/student') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  if (!isMobile) {
    return null;
  }

  return (
    <Paper
      shadow='lg'
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: `1px solid var(--mantine-color-${isDark ? 'dark-4' : 'gray-3'})`,
        borderRadius: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      p='xs'
      pb='calc(var(--mantine-spacing-xs) + env(safe-area-inset-bottom, 0px))'
    >
      <Group justify='space-around' gap={0}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Stack
              key={item.path}
              align='center'
              gap='4px'
              style={{
                cursor: 'pointer',
                flex: 1,
                minHeight: '60px',
                justifyContent: 'center',
              }}
              onClick={() => handleNavigation(item.href)}
            >
              <ActionIcon
                variant={active ? 'filled' : 'transparent'}
                color={active ? 'blue' : 'dimmed'}
                size='lg'
                radius='md'
              >
                {item.icon}
              </ActionIcon>
              <Text
                size='xs'
                c={active ? 'blue' : 'dimmed'}
                fw={active ? 600 : 400}
                ta='center'
                style={{
                  transition: 'all 0.2s ease',
                  lineHeight: 1,
                }}
              >
                {item.label}
              </Text>
            </Stack>
          );
        })}
      </Group>
    </Paper>
  );
}
