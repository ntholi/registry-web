import { DetailsView, DetailsViewHeader, FieldView } from '@/components/adease';
import {
  deleteClearanceRequest,
  getClearanceRequest,
} from '@/server/clearance-requests/actions';
import {
  Anchor,
  Badge,
  Card,
  Divider,
  Flex,
  Grid,
  GridCol,
  Paper,
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
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ClearanceSwitch from './ClearanceSwitch';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceRequestDetails({ params }: Props) {
  const { id } = await params;
  const request = await getClearanceRequest(Number(id));

  if (!request) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Clearance Request'}
        queryKey={['clearanceRequests']}
        handleDelete={async () => {
          'use server';
          await deleteClearanceRequest(Number(id));
        }}
      />
      <Stack p='lg'>
        <Grid>
          <GridCol span={{ base: 12, md: 7 }}>
            <Paper withBorder p='md'>
              <Stack>
                <FieldView label='Student' underline={false}>
                  <Anchor
                    component={Link}
                    href={`/admin/students/${request.stdNo}`}
                  >
                    {request.student.name}
                  </Anchor>
                </FieldView>
                <FieldView label='Program' underline={false}>
                  {request.student.structure?.program.name}
                </FieldView>
              </Stack>
            </Paper>
          </GridCol>
          <GridCol span={{ base: 12, md: 5 }}>
            <ClearanceSwitch request={request} />
          </GridCol>
        </Grid>
        <Divider />
        <ModulesTable
          requestedModules={request.registrationRequest.requestedModules}
        />
      </Stack>
    </DetailsView>
  );
}

type Module = NonNullable<
  Awaited<ReturnType<typeof getClearanceRequest>>
>['registrationRequest']['requestedModules'];

function ModulesTable({ requestedModules }: { requestedModules: Module }) {
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
