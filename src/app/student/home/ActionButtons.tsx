'use client';
import {
  MantineColor,
  Grid,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Box,
  Group,
} from '@mantine/core';
import {
  Icon,
  IconChevronRight,
  IconClipboardCheck,
  IconFileText,
} from '@tabler/icons-react';
import Link from 'next/link';
import { studentColors } from '../utils/colors';

type Action = {
  label: string;
  icon: Icon;
  href: string;
  color: MantineColor;
  description: string;
};

const actions: Action[] = [
  {
    label: 'Registration',
    icon: IconClipboardCheck,
    href: '/student/registration',
    color: studentColors.theme.primary,
    description: 'Submit or view your registration requests',
  },
  {
    label: 'Transcripts',
    icon: IconFileText,
    href: '/student/transcripts',
    color: studentColors.theme.primary,
    description: 'View and download your academic transcripts',
  },
];

export default function ActionButtons() {
  return (
    <Box mt='xl'>
      <Grid gutter='lg'>
        {actions.map((action) => (
          <Grid.Col key={action.label} span={{ base: 12, sm: 6 }}>
            <Paper
              component={Link}
              href={action.href}
              shadow='sm'
              p='lg'
              radius='md'
              withBorder
            >
              <Group gap='md' wrap='nowrap'>
                <ThemeIcon
                  size='xl'
                  radius='md'
                  variant='light'
                  color={action.color}
                >
                  <action.icon size='1.5rem' />
                </ThemeIcon>
                <Stack gap={4} flex={1}>
                  <Text size='lg' fw={600}>
                    {action.label}
                  </Text>
                  <Text size='sm' c='dimmed' lh={1.4}>
                    {action.description}
                  </Text>
                </Stack>
                <IconChevronRight size='1rem' />
              </Group>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>
    </Box>
  );
}
