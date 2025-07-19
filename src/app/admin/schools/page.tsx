'use client';

import { getAllSchools } from '@/server/schools/actions';
import {
  Card,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function SchoolsPage() {
  const { data: schools, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: getAllSchools,
    select: (data) => data.items,
  });

  return (
    <Stack p='lg'>
      <Title order={2}>Schools</Title>
      <Text c='dimmed' size='sm'>
        Select a school to view its programs and modules
      </Text>

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={120} radius='md' />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {schools?.map((school) => (
            <UnstyledButton
              key={school.id}
              component={Link}
              href={`/admin/schools/programs?schoolId=${school.id}`}
            >
              <Card withBorder shadow='sm' padding='lg'>
                <Stack gap='xs' align='center' justify='center' h='100%'>
                  <IconSchool size={28} />
                  <Text fw={500} ta='center' lineClamp={1}>
                    {school.name}
                  </Text>
                  <Text size='sm' c='dimmed' ta='center'>
                    {school.code}
                  </Text>
                </Stack>
              </Card>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      )}

      {!isLoading && schools && schools.length === 0 && (
        <Card withBorder shadow='sm' padding='xl'>
          <Stack align='center' gap='xs'>
            <IconSchool size={48} />
            <Text size='lg' fw={500}>
              No Schools Found
            </Text>
            <Text size='sm' c='dimmed' ta='center'>
              Contact your administrator to add schools to the system.
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
