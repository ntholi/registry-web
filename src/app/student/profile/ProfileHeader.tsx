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
  SimpleGrid,
  Paper,
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
import { useMediaQuery } from '@/utils/use-media-query';
import { getStudentPhoto } from '@/server/students/actions';
import { useQuery } from '@tanstack/react-query';

type Props = {
  student: NonNullable<Student>;
};

export default function ProfileHeader({ student }: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const { data: photoUrl } = useQuery({
    queryKey: ['studentPhoto', student?.stdNo],
    queryFn: () => getStudentPhoto(student?.stdNo),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Card withBorder shadow='sm' p='xl' radius='md'>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        gap='xl'
        align={{ base: 'center', sm: 'flex-start' }}
      >
        <Avatar
          size={180}
          radius='md'
          src={photoUrl}
          color={studentColors.theme.primary}
          style={{ minWidth: 120 }}
        >
          {!photoUrl && <>{<IconUser size='3rem' />}</>}
        </Avatar>

        <Stack gap='md' style={{ flex: 1 }}>
          <Stack gap='xs' align={isMobile ? 'center' : 'flex-start'}>
            <Title order={1} size='h2' fw={600} mb='xs'>
              {student.name}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
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
            </SimpleGrid>
          </Stack>

          <Divider />

          <SimpleGrid cols={{ base: 2, sm: 3 }}>
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

            {student.dateOfBirth && (
              <Group gap='xs'>
                <ThemeIcon variant='light' size='sm' color='gray'>
                  <IconCalendar size={14} />
                </ThemeIcon>
                <Text size='sm' c='dimmed'>
                  {formatDate(student.dateOfBirth, 'numeric')}
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
          </SimpleGrid>
        </Stack>
      </Flex>
    </Card>
  );
}
