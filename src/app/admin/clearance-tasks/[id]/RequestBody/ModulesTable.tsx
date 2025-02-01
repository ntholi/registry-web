import {
  Badge,
  Card,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from '@mantine/core';
import { getClearanceTask } from '@/server/clearance-tasks/actions';

type Module = NonNullable<
  Awaited<ReturnType<typeof getClearanceTask>>
>['registrationRequest']['requestedModules'];

export function ModulesTable({
  requestedModules,
}: {
  requestedModules: Module;
}) {
  const rows = requestedModules.map(({ module, moduleStatus }) => (
    <TableTr key={module.id}>
      <TableTd fw={500}>{module.code}</TableTd>
      <TableTd>{module.name}</TableTd>
      <TableTd>{module.credits}</TableTd>
      <TableTd>
        <Text size='sm' c={module.type === 'Delete' ? 'red' : undefined}>
          {module.type}
        </Text>
      </TableTd>
      <TableTd>
        <Badge
          variant='light'
          size='sm'
          color={
            moduleStatus === 'Compulsory'
              ? 'green'
              : moduleStatus.startsWith('Repeat')
              ? 'red'
              : 'blue'
          }
        >
          {moduleStatus}
        </Badge>
      </TableTd>
    </TableTr>
  ));

  return (
    <Card withBorder>
      <Table>
        <TableThead>
          <TableTr>
            <TableTh w={95}>Code</TableTh>
            <TableTh>Name</TableTh>
            <TableTh w={68}>Credits</TableTh>
            <TableTh w={62}>Type</TableTh>
            <TableTh w={120}>Status</TableTh>
          </TableTr>
        </TableThead>
        <TableTbody>{rows}</TableTbody>
      </Table>
    </Card>
  );
}
