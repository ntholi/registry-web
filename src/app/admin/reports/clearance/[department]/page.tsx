import { auth } from '@/auth';
import { db } from '@/db';
import { DashboardUser, registrationClearances, users } from '@/db/schema';
import { and, count, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import {
  Card,
  Stack,
  Text,
  Title,
  Table,
  TableThead,
  TableTr,
  TableTh,
  TableTd,
  TableTbody,
  Badge,
} from '@mantine/core';
import { toTitleCase } from '@/lib/utils';

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

  // Validate department parameter
  if (
    !['finance', 'library', 'registry', 'academic'].includes(params.department)
  ) {
    notFound();
  }

  const department = params.department as DashboardUser;

  // Get all users who have responded to clearances for this department
  const stats = await db
    .select({
      respondedBy: registrationClearances.respondedBy,
      approved: count(
        and(
          eq(registrationClearances.status, 'approved'),
          eq(registrationClearances.department, department),
        ),
      ),
      rejected: count(
        and(
          eq(registrationClearances.status, 'rejected'),
          eq(registrationClearances.department, department),
        ),
      ),
      total: count(registrationClearances.id),
    })
    .from(registrationClearances)
    .where(eq(registrationClearances.department, department))
    .groupBy(registrationClearances.respondedBy);

  // Fetch user names for all respondedBy IDs
  const userIds = stats
    .map((stat) => stat.respondedBy)
    .filter(Boolean) as string[];
  const userNames = await db.query.users.findMany({
    where: (users, { inArray }) => inArray(users.id, userIds),
    columns: {
      id: true,
      name: true,
    },
  });

  // Create a map of user IDs to names
  const userNameMap = new Map(userNames.map((user) => [user.id, user.name]));

  return (
    <Stack p='lg'>
      <Title order={2}>Clearance Statistics - {toTitleCase(department)}</Title>
      <Text size='sm' c='dimmed'>
        Statistics showing the number of students cleared by each staff member
      </Text>
      <Card withBorder>
        <Table striped highlightOnHover withTableBorder>
          <TableThead>
            <TableTr>
              <TableTh>Staff Member</TableTh>
              <TableTh>Total Requests</TableTh>
              <TableTh>Approved</TableTh>
              <TableTh>Rejected</TableTh>
              <TableTh>Approval Rate</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {stats.map((stat) => {
              const approvalRate =
                stat.total > 0
                  ? Math.round((stat.approved / stat.total) * 100)
                  : 0;

              return (
                <TableTr key={stat.respondedBy}>
                  <TableTd>
                    {userNameMap.get(stat.respondedBy || '') || 'Unknown'}
                  </TableTd>
                  <TableTd>{stat.total}</TableTd>
                  <TableTd>
                    <Badge color='green' variant='light'>
                      {stat.approved}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Badge color='red' variant='light'>
                      {stat.rejected}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Badge
                      color={
                        approvalRate >= 70
                          ? 'green'
                          : approvalRate >= 40
                            ? 'yellow'
                            : 'red'
                      }
                      variant='light'
                    >
                      {approvalRate}%
                    </Badge>
                  </TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </Card>
    </Stack>
  );
}
