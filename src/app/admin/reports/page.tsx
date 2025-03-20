import { dashboardUsers } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';
import {
  Card,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconFilePencil } from '@tabler/icons-react';
import Link from 'next/link';

export default function ReportsPage() {
  const departments = dashboardUsers.filter(
    (dept) => dept !== 'admin' && dept !== 'resource',
  );

  return (
    <Stack>
      <Title order={2}>Clearance Reports</Title>
      <Text c='dimmed' size='sm'>
        Select a department to view clearance statistics
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {departments.map((dept) => (
          <UnstyledButton
            key={dept}
            component={Link}
            href={`/admin/reports/clearance/${dept}`}
          >
            <Card withBorder shadow='sm' padding='lg'>
              <Stack gap='xs' align='center'>
                <IconFilePencil size={24} />
                <Text fw={500}>{toTitleCase(dept)} Department</Text>
                <Text size='sm' c='dimmed'>
                  View clearance statistics
                </Text>
              </Stack>
            </Card>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
