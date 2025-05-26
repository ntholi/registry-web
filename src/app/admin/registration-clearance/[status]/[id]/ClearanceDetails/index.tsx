'use client';

import { FieldView } from '@/components/adease';
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  ActionIcon,
  Anchor,
  Grid,
  GridCol,
  Group,
  Paper,
  Stack,
  Textarea,
  Tooltip,
} from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import ClearanceSwitch from './ClearanceSwitch';
import { ModulesTable } from './ModulesTable';
import { getRegistrationClearance } from '@/server/registration-clearance/actions';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import SponsorInfo from '../SponsorInfo';
import { formatDateTime } from '@/lib/utils';

type Props = {
  request: NonNullable<Awaited<ReturnType<typeof getRegistrationClearance>>>;
  termId: number;
};

export default function ClearanceDetails({ request, termId }: Props) {
  const [comment, setComment] = useState(request.message || undefined);
  const [accordion, setAccordion] = useState<'comments' | 'modules'>('modules');
  const { student } = request.registrationRequest;

  return (
    <Stack p='lg'>
      <Grid>
        <GridCol span={{ base: 12, md: 7 }}>
          <Paper withBorder p='md'>
            <Stack>
              <FieldView label='Student Number' underline={false}>
                <Group justify='space-between'>
                  <Anchor
                    component={Link}
                    href={`/admin/students/${student.stdNo}`}
                  >
                    {student.stdNo}
                  </Anchor>
                  <Tooltip label='Copy'>
                    <ActionIcon
                      variant='subtle'
                      color='gray'
                      onClick={() => {
                        navigator.clipboard.writeText(String(student.stdNo));
                        notifications.show({
                          message: 'Copied to clipboard',
                          color: 'green',
                        });
                      }}
                    >
                      <IconCopy size={'1rem'} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </FieldView>
              <FieldView label='Date Requested' underline={false}>
                {formatDateTime(request.registrationRequest.createdAt)}
              </FieldView>
              <FieldView label='Program' underline={false}>
                {request.programName}
              </FieldView>
              <SponsorInfo
                stdNo={request.registrationRequest.stdNo}
                termId={termId}
              />
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
