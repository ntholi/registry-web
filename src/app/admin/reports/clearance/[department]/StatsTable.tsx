import { ClearanceStats } from '@/server/reports/clearance/service';
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
  data: ClearanceStats[];
}

export function StatsTable({ data }: Props) {
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
        {data.map((stat) => (
          <TableTr key={stat.respondedBy}>
            <TableTd>{stat.staffName}</TableTd>
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
                  stat.approvalRate >= 70
                    ? 'green'
                    : stat.approvalRate >= 40
                      ? 'yellow'
                      : 'red'
                }
                variant='light'
              >
                {stat.approvalRate}%
              </Badge>
            </TableTd>
          </TableTr>
        ))}
      </TableTbody>
    </Table>
  );
}
