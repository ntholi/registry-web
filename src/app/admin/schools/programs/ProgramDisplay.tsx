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
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBook,
  IconChevronRight,
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

type Structure = {
  id: number;
  code: string;
  desc: string | null;
  programId: number;
  createdAt: Date | null;
};

type Props = {
  program: {
    id: number;
    name: string;
    code: string;
  };
};

export default function ProgramDisplay({ program }: Props) {
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
            {structures.map((structure) => (
              <UnstyledButton
                key={structure.id}
                component={Link}
                href={`/admin/schools/programs/${structure.id}`}
              >
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
                    <Stack justify='center'>
                      <IconChevronRight size={16} />
                    </Stack>
                  </Group>
                </Card>
              </UnstyledButton>
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
