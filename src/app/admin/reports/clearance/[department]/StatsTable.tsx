import { users } from '@/db/schema';
import { db } from '@/db';
import {
  Table,
  TableThead,
  TableTr,
  TableTh,
  TableTd,
  TableTbody,
  Badge,
} from '@mantine/core';

interface Props {
  data: {
    respondedBy: string | null;
    approved: number;
    rejected: number;
    total: number;
  }[];
}

export async function StatsTable({ data }: Props) {
  // Fetch user names for all respondedBy IDs
  const userIds = data
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
        {data.map((stat) => {
          const approvalRate =
            stat.total > 0 ? Math.round((stat.approved / stat.total) * 100) : 0;

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
  );
}
