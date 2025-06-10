'use client';

import { getMarksAudit } from '@/server/assessment-marks/actions';
import { generateAssessmentMarkAuditMessage } from '@/utils/auditUtils';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconEdit,
  IconHistory,
  IconInfoCircle,
  IconPlus,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getAssessmentTypeLabel } from '../../assessments/[id]/assessments';

interface Props {
  stdNo: number;
  studentName: string;
}

export default function MarksAuditModal({ stdNo, studentName }: Props) {
  const [opened, { open, close }] = useDisclosure(false);

  const { data: auditHistory, isLoading } = useQuery({
    queryKey: ['marksAudit', stdNo],
    queryFn: () => getMarksAudit(stdNo),
    enabled: opened,
  });

  const getActionColor = (action: 'create' | 'update' | 'delete') => {
    switch (action) {
      case 'create':
        return 'green';
      case 'update':
        return 'blue';
      case 'delete':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <>
      <Tooltip label='View Assessment Marks History'>
        <ActionIcon variant='subtle' color='gray' onClick={open}>
          <IconHistory size={16} />
        </ActionIcon>
      </Tooltip>
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap='md' align='center'>
            <Avatar size='md' radius='md' variant='light' color='blue'>
              <IconUser size={20} />
            </Avatar>
            <Box>
              <Text fw={600} size='lg' mb={2}>
                Assessment Marks History
              </Text>
              <Text size='sm' c='dimmed'>
                {studentName} ({stdNo})
              </Text>
            </Box>
          </Group>
        }
        size='xl'
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        radius='lg'
        padding='xl'
      >
        {isLoading ? (
          <Center py='xl'>
            <Stack align='center' gap='md'>
              <Loader size='lg' variant='dots' color='blue' />
              <Text size='sm' c='dimmed'>
                Loading assessment marks history...
              </Text>
            </Stack>
          </Center>
        ) : !auditHistory || auditHistory.length === 0 ? (
          <Paper p='xl' radius='lg' withBorder>
            <Center>
              <Stack align='center' gap='lg'>
                <Avatar size='xl' radius='xl' variant='light' color='gray'>
                  <IconInfoCircle size={32} />
                </Avatar>
                <Stack align='center' gap='xs'>
                  <Text fw={500} size='lg'>
                    No Assessment History
                  </Text>
                  <Text c='dimmed' size='sm' ta='center'>
                    No assessment mark changes have been recorded for this
                    student yet.
                    <br />
                    All future modifications will appear here.
                  </Text>
                </Stack>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Box style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Stack gap='sm'>
              {' '}
              {auditHistory.map((audit) => {
                const assessmentType = getAssessmentTypeLabel(
                  audit.assessmentMark?.assessment?.assessmentType,
                );
                const auditMessage = generateAssessmentMarkAuditMessage(
                  audit.action,
                  audit.previousMarks,
                  audit.newMarks,
                  assessmentType,
                );

                return (
                  <Paper
                    key={audit.id}
                    p='md'
                    radius='md'
                    withBorder
                    shadow='xs'
                  >
                    <Box>
                      <Text size='sm' lh={1.4} mb='sm'>
                        {auditMessage}
                      </Text>
                      <Group gap='sm' align='center'>
                        <Avatar
                          size='xs'
                          radius='xl'
                          color='blue'
                          variant='light'
                          src={audit.createdByUser?.image}
                        />
                        <Text size='xs' fw={500}>
                          {audit.createdByUser?.name || 'Unknown User'}
                        </Text>
                        <Text size='xs' c='dimmed'>
                          •
                        </Text>
                        <Text size='xs' c='dimmed'>
                          {format(
                            new Date(audit.date),
                            "dd MMM yyyy 'at' HH:mm",
                          )}
                        </Text>{' '}
                      </Group>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        )}
      </Modal>
    </>
  );
}
