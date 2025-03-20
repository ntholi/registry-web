import { fetchClearanceStats } from '@/server/reports/clearance/actions';
import { notFound, redirect } from 'next/navigation';
import { Stack, Title, Text, Card } from '@mantine/core';
import { toTitleCase } from '@/lib/utils';
import { auth } from '@/auth';
import { StatsTable } from './StatsTable';
import { DashboardUser } from '@/db/schema';

interface Props {
  params: {
    department: string;
  };
}

export default async function ClearanceReportsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect('/login');
  }

  if (
    !['finance', 'library', 'registry', 'academic'].includes(params.department)
  ) {
    notFound();
  }

  const stats = await fetchClearanceStats(params.department as DashboardUser);

  return (
    <Stack p='lg'>
      <Title order={2}>
        Clearance Statistics - {toTitleCase(params.department)}
      </Title>
      <Text size='sm' c='dimmed'>
        Statistics showing the number of students cleared by each staff member
      </Text>
      <Card withBorder>
        <StatsTable data={stats} />
      </Card>
    </Stack>
  );
}
