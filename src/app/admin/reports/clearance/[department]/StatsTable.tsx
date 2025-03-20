import { ClearanceStats } from '@/server/reports/clearance/service';
import {
  Table,
  TableThead,
  TableTr,
  TableTh,
  TableTd,
  TableTbody,
  Badge,
  Text,
  Paper,
  Center,
  Progress,
} from '@mantine/core';

interface Props {
  data: ClearanceStats[];
}

export function StatsTable({ data }: Props) {
  if (!data.length) {
    return (
      <Center py='xl'>
        <Text c='dimmed'>No statistics available for the selected period</Text>
      </Center>
    );
  }

  // Sort by total requests (descending)
  const sortedData = [...data].sort((a, b) => b.total - a.total);

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
        {sortedData.map((stat) => (
          <TableTr key={stat.respondedBy || 'unknown'}>
            <TableTd>
              <Text fw={500}>{stat.staffName}</Text>
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
              <div>
                <Text size='xs' fw={500} c='dimmed' mb={5}>
                  {stat.approvalRate}%
                </Text>
                <Progress
                  value={stat.approvalRate}
                  size='sm'
                  color={
                    stat.approvalRate >= 70
                      ? 'green'
                      : stat.approvalRate >= 40
                        ? 'yellow'
                        : 'red'
                  }
                />
              </div>
            </TableTd>
          </TableTr>
        ))}
      </TableTbody>
    </Table>
  );
}
