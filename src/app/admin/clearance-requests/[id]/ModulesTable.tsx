import { getClearanceRequest } from '@/server/clearance-requests/actions';
import {
  Badge,
  Card,
  Flex,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
} from '@mantine/core';

type Module = NonNullable<
  Awaited<ReturnType<typeof getClearanceRequest>>
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
      <TableTd>{module.type}</TableTd>
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
    <Stack>
      <Flex justify={'space-between'}>
        <Title order={4} fw={500}>
          Requested Modules
        </Title>
        <Text c='dimmed' size='sm'>
          {requestedModules.length}
          {requestedModules.length === 1 ? ' Module' : ' Modules'}
        </Text>
      </Flex>
      <Card withBorder>
        <Table>
          <TableThead>
            <TableTr>
              <TableTh w={95}>Code</TableTh>
              <TableTh>Name</TableTh>
              <TableTh w={60}>Credits</TableTh>
              <TableTh w={62}>Type</TableTh>
              <TableTh w={120}>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>{rows}</TableTbody>
        </Table>
      </Card>
    </Stack>
  );
}
