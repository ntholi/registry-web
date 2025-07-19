'use client';

import {
  Accordion,
  Badge,
  Box,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Alert,
  Anchor,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBook,
  IconInfoCircle,
  IconSchool,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { redirect, useSearchParams } from 'next/navigation';
import { getProgramsBySchoolId } from '@/server/students/actions';
import { getStructuresByProgram } from '@/server/semester-modules/actions';
import { getSchool } from '@/server/schools/actions';
import { useRouter } from 'next/navigation';

type Program = {
  id: number;
  name: string;
  code: string;
};

type Structure = {
  id: number;
  code: string;
  desc: string | null;
  programId: number;
  createdAt: Date | null;
};

function ProgramAccordion({ program }: { program: Program }) {
  const { data: structures, isLoading } = useQuery({
    queryKey: ['structures', program.id],
    queryFn: () => getStructuresByProgram(program.id),
  });

  return (
    <Accordion.Item value={program.id.toString()}>
      <Accordion.Control>
        <Group>
          <ThemeIcon variant='light' color='blue' size='xl'>
            <IconBook size='1.1rem' />
          </ThemeIcon>
          <Box style={{ flex: 1 }}>
            <div>
              <Text fw={600} size='sm'>
                {program.code}
              </Text>
              <Text size='sm' c='dimmed' lineClamp={1}>
                {program.name}
              </Text>
            </div>
          </Box>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        {isLoading ? (
          <Stack gap='xs'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={40} radius='sm' />
            ))}
          </Stack>
        ) : structures && structures.length > 0 ? (
          <Stack gap='xs'>
            <Text size='sm' fw={500} c='dimmed' mb='xs'>
              Structures ({structures.length})
            </Text>
            {structures.map((structure: Structure) => (
              <Card key={structure.id} withBorder padding='sm' radius='sm'>
                <Group justify='space-between'>
                  <div>
                    <Text fw={500} size='sm'>
                      {structure.code}
                    </Text>
                    {structure.desc && (
                      <Text size='xs' c='dimmed'>
                        {structure.desc}
                      </Text>
                    )}
                  </div>
                  <Badge variant='outline' size='xs'>
                    ID: {structure.id}
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title='No structures found'
            color='blue'
            variant='light'
          >
            This program currently has no structures defined.
          </Alert>
        )}
      </Accordion.Panel>
    </Accordion.Item>
  );
}

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
    router.push('/admin/schools');
  }

  return (
    <Stack p='lg'>
      <Group>
        <Anchor component={Link} href='/admin/schools'>
          <Group gap='xs' c='dimmed' style={{ cursor: 'pointer' }}>
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
            <ProgramAccordion key={program.id} program={program} />
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
