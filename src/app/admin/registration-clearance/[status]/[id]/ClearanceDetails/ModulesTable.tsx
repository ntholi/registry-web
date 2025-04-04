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
import { getRegistrationClearance } from '@/server/registration-clearance/actions';

type Module = NonNullable<
  Awaited<ReturnType<typeof getRegistrationClearance>>
>['registrationRequest']['requestedModules'];

export function ModulesTable({
  requestedModules,
}: {
  requestedModules: Module;
}) {
  const rows = [...requestedModules]
    .sort((a, b) => {
      const aIsRepeat = a.moduleStatus.startsWith('Repeat');
      const bIsRepeat = b.moduleStatus.startsWith('Repeat');
      if (aIsRepeat && !bIsRepeat) return -1;
      if (!aIsRepeat && bIsRepeat) return 1;
      return 0;
    })
    .map(({ module, moduleStatus }) => (
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
