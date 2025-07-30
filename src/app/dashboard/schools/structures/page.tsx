'use client';

import { getSchool } from '@/server/schools/actions';
import { getProgramsBySchoolId } from '@/server/students/actions';
import {
  Accordion,
  Anchor,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconBook, IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProgramDisplay from './ProgramDisplay';

type Program = {
  id: number;
  name: string;
  code: string;
};

export default function SchoolProgramsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => (schoolId ? getSchool(Number(schoolId)) : null),
    enabled: !!schoolId,
  });

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['programs', schoolId],
    queryFn: () => (schoolId ? getProgramsBySchoolId(Number(schoolId)) : []),
    enabled: !!schoolId,
  });

  if (!schoolId) {
    router.push('/dashboard/schools');
  }

  return (
    <Stack p='lg'>
      <Group>
        <Anchor c='dimmed' component={Link} href='/dashboard/schools'>
          <Group gap='xs'>
            <IconArrowLeft size={16} />
            <Text size='sm'>Back to Schools</Text>
          </Group>
        </Anchor>
      </Group>

      {schoolLoading ? (
        <Skeleton height={40} />
      ) : (
        <Group>
          <ThemeIcon variant='light' color='gray' size='xl'>
            <IconSchool size='1.1rem' />
          </ThemeIcon>
          <div>
            <Title order={2}>{school?.name || 'School'}</Title>
            <Text c='dimmed' size='sm'>
              Programs and their structures
            </Text>
          </div>
        </Group>
      )}

      {programsLoading ? (
        <Stack gap='md'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={80} radius='md' />
          ))}
        </Stack>
      ) : programs && programs.length > 0 ? (
        <Accordion variant='separated' radius='md' multiple defaultValue={[]}>
          {programs.map((program: Program) => (
            <ProgramDisplay key={program.id} program={program} />
          ))}
        </Accordion>
      ) : (
        <Card withBorder shadow='sm' padding='xl'>
          <Stack align='center' gap='xs'>
            <IconBook size={48} />
            <Text size='lg' fw={500}>
              No Programs Found
            </Text>
            <Text size='sm' c='dimmed' ta='center'>
              This school currently has no programs defined.
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
