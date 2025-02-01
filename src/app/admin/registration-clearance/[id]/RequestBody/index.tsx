'use client';

import { FieldView } from '@/components/adease';
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
import { useState } from 'react';
import ClearanceSwitch from './ClearanceSwitch';
import { ModulesTable } from './ModulesTable';
import { getRegistrationClearance } from '@/server/registration-clearance/actions';

type Props = {
  request: NonNullable<Awaited<ReturnType<typeof getRegistrationClearance>>>;
};

export default function RequestBody({ request }: Props) {
  const [comment, setComment] = useState('');
  const [accordion, setAccordion] = useState<'comments' | 'modules'>('modules');
  const { student } = request.registrationRequest;

  return (
    <Stack p='lg'>
      <Grid>
        <GridCol span={{ base: 12, md: 7 }}>
          <Paper withBorder p='md'>
            <Stack>
              <FieldView label='Student' underline={false}>
                <Anchor
                  component={Link}
                  href={`/admin/students/${student.stdNo}`}
                >
                  {student.name}
                </Anchor>
              </FieldView>
              <FieldView label='Program' underline={false}>
                {student.structure?.program.name}
              </FieldView>
            </Stack>
          </Paper>
        </GridCol>
        <GridCol span={{ base: 12, md: 5 }}>
          <ClearanceSwitch
            request={request}
            setAccordion={setAccordion}
            comment={comment}
          />
        </GridCol>
      </Grid>
      <Accordion
        value={accordion}
        onChange={(it) => setAccordion(it as 'comments' | 'modules')}
        variant='separated'
      >
        <AccordionItem value='comments'>
          <AccordionControl>Comments</AccordionControl>
          <AccordionPanel>
            <Textarea
              value={comment}
              description='Optional '
              onChange={(e) => setComment(e.currentTarget.value)}
              placeholder='Why is the student not cleared?'
            />
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
