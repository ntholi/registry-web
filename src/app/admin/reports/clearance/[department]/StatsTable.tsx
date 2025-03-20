import { ClearanceStats } from '@/server/reports/clearance/service';
import {
  Center,
  Progress,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
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

  const sortedData = [...data].sort((a, b) => b.total - a.total);
  const totalRequests = sortedData.reduce((sum, stat) => sum + stat.total, 0);

  return (
    <Table withTableBorder>
      <TableThead>
        <TableTr>
          <TableTh>Staff Member</TableTh>
          <TableTh>Approved</TableTh>
          <TableTh>Rejected</TableTh>
          <TableTh>Total</TableTh>
          <TableTh>Total Responses</TableTh>
        </TableTr>
      </TableThead>
      <TableTbody>
        {sortedData.map((stat) => {
          const percentOfTotal =
            totalRequests > 0
              ? Math.round((stat.total / totalRequests) * 100)
              : 0;

          return (
            <TableTr key={stat.respondedBy || 'unknown'}>
              <TableTd>
                <Text size='sm'>{stat.staffName}</Text>
              </TableTd>
              <TableTd>
                <Text size='sm'>{stat.approved}</Text>
              </TableTd>
              <TableTd>
                <Text size='sm'>{stat.rejected}</Text>
              </TableTd>
              <TableTd>
                <Text size='sm'>{stat.total}</Text>
              </TableTd>
              <TableTd>
                <div>
                  <Text size='xs' fw={500} c='dimmed' mb={5}>
                    {percentOfTotal}%
                  </Text>
                  <Progress
                    value={percentOfTotal}
                    size='sm'
                    color={
                      percentOfTotal >= 30
                        ? 'blue'
                        : percentOfTotal >= 20
                          ? 'blue'
                          : 'red'
                    }
                  />
                </div>
              </TableTd>
            </TableTr>
          );
        })}
      </TableTbody>
    </Table>
  );
}
