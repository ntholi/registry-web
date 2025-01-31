import { DetailsView, DetailsViewHeader, FieldView } from '@/components/adease';
import {
  deleteClearanceRequest,
  getClearanceRequest,
} from '@/server/clearance-requests/actions';
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Anchor,
  Grid,
  GridCol,
  Paper,
  Stack,
  Textarea,
} from '@mantine/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ClearanceSwitch from './ClearanceSwitch';
import { ModulesTable } from './ModulesTable';

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
        <Accordion defaultValue='modules' variant='separated'>
          <AccordionItem value='comments'>
            <AccordionControl>Comments</AccordionControl>
            <AccordionPanel>
              <Textarea />
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem value='modules'>
            <AccordionControl>Modules</AccordionControl>
            <AccordionPanel>
              <ModulesTable
                requestedModules={request.registrationRequest.requestedModules}
              />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Stack>
    </DetailsView>
  );
}
