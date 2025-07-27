'use client';
import { formatDate } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  Title,
  ThemeIcon,
  Flex,
  Divider,
} from '@mantine/core';
import {
  IconUser,
  IconIdBadge2,
  IconCalendar,
  IconPhone,
  IconGenderBigender,
  IconHeart,
} from '@tabler/icons-react';
import { studentColors } from '../utils/colors';

import { Student } from '@/lib/helpers/students';

type Props = {
  student: NonNullable<Student>;
};

export default function ProfileHeader({ student }: Props) {
  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card withBorder shadow='sm' p='xl' radius='md'>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        gap='xl'
        align={{ base: 'center', sm: 'flex-start' }}
      >
        <Avatar
          size={120}
          radius='md'
          src={student.user?.image}
          color={studentColors.theme.primary}
          style={{ minWidth: 120 }}
        >
          {!student.user?.image && <>{initials || <IconUser size='3rem' />}</>}
        </Avatar>

        <Stack gap='md' style={{ flex: 1 }}>
          <div>
            <Title order={1} size='h2' fw={600} mb='xs'>
              {student.name}
            </Title>
            <Group gap='md' mb='sm'>
              <Badge
                size='lg'
                variant='light'
                color={studentColors.theme.primary}
                leftSection={<IconIdBadge2 size={16} />}
              >
                {student.stdNo}
              </Badge>
              {student.user?.email && (
                <Text size='sm' c='dimmed' fw={500}>
                  {student.user.email}
                </Text>
              )}
            </Group>
          </div>

          <Divider />

          <Group gap='xl' wrap='wrap'>
            {student.dateOfBirth && (
              <Group gap='xs'>
                <ThemeIcon variant='light' size='sm' color='gray'>
                  <IconCalendar size={14} />
                </ThemeIcon>
                <Text size='sm' c='dimmed'>
                  Born {formatDate(student.dateOfBirth)}
                </Text>
              </Group>
            )}

            {student.gender && (
              <Group gap='xs'>
                <ThemeIcon variant='light' size='sm' color='gray'>
                  <IconGenderBigender size={14} />
                </ThemeIcon>
                <Text size='sm' c='dimmed'>
                  {student.gender}
                </Text>
              </Group>
            )}

            {student.maritalStatus && (
              <Group gap='xs'>
                <ThemeIcon variant='light' size='sm' color='gray'>
                  <IconHeart size={14} />
                </ThemeIcon>
                <Text size='sm' c='dimmed'>
                  {student.maritalStatus}
                </Text>
              </Group>
            )}

            {student.phone1 && (
              <Group gap='xs'>
                <ThemeIcon variant='light' size='sm' color='gray'>
                  <IconPhone size={14} />
                </ThemeIcon>
                <Text size='sm' c='dimmed'>
                  {student.phone1}
                </Text>
              </Group>
            )}
          </Group>
        </Stack>
      </Flex>
    </Card>
  );
}
