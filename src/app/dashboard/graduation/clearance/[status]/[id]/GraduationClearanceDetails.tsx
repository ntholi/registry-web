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
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import { formatDateTime } from '@/lib/utils';
import { getGraduationClearance } from '@/server/graduation/clearance/actions';
import GraduationClearanceSwitch from './GraduationClearanceSwitch';
import PaymentReceiptsView from '@/app/student/graduation/[id]/PaymentReceiptsView';
import PaymentReceipts from './PaymentReceipts';
import { useSession } from 'next-auth/react';

type Props = {
  request: NonNullable<Awaited<ReturnType<typeof getGraduationClearance>>>;
};

export default function GraduationClearanceDetails({ request }: Props) {
  const [comment, setComment] = useState(request.message || undefined);
  const [accordion, setAccordion] = useState<'comments'>('comments');
  const { student } = request.graduationRequest;
  const { data: session } = useSession();

  return (
    <Stack p='lg'>
      <Grid>
        <GridCol span={{ base: 12, md: 7 }}>
          <Stack>
            <Paper withBorder p='md'>
              <Stack>
                <FieldView label='Student Number' underline={false}>
                  <Group justify='space-between'>
                    <Anchor
                      component={Link}
                      href={`/dashboard/students/${student.stdNo}`}
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
                  {formatDateTime(request.graduationRequest.createdAt)}
                </FieldView>
              </Stack>
            </Paper>
          </Stack>
        </GridCol>
        <GridCol span={{ base: 12, md: 5 }}>
          <GraduationClearanceSwitch
            request={request}
            setAccordion={setAccordion}
            comment={comment}
          />
        </GridCol>
      </Grid>
      {session?.user?.role === 'finance' && (
        <Paper withBorder p='md'>
          <PaymentReceipts graduationRequest={request.graduationRequest} />
        </Paper>
      )}
      <Accordion
        value={accordion}
        onChange={(it) => setAccordion(it as 'comments')}
        variant='separated'
      >
        <AccordionItem value='comments'>
          <AccordionControl>Comments</AccordionControl>
          <AccordionPanel>
            <Textarea
              value={comment}
              rows={4}
              description='Optional comments or notes'
              onChange={(e) => setComment(e.currentTarget.value)}
              placeholder='Add any relevant comments about the clearance...'
            />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}
