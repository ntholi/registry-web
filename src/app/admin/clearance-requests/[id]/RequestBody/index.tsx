'use client';

import { FieldView } from '@/components/adease';
import { getClearanceRequest } from '@/server/clearance-requests/actions';
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
import ClearanceSwitch from './ClearanceSwitch';
import { ModulesTable } from './ModulesTable';

type Props = {
  request: NonNullable<Awaited<ReturnType<typeof getClearanceRequest>>>;
};

export default function index({ request }: Props) {
  return (
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
  );
}
