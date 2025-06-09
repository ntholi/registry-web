'use client';

import { formatDateTime } from '@/lib/utils';
import { getAssessmentAuditHistory } from '@/server/assessments/actions';
import { generateAssessmentAuditMessage } from '@/utils/auditUtils';
import {
  ActionIcon,
  Modal,
  Timeline,
  Text,
  Stack,
  Center,
  Loader,
  Group,
  Badge,
  Tooltip,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconHistory,
  IconPlus,
  IconEdit,
  IconTrash,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
  getAssessmentTypeLabel,
  getAssessmentNumberLabel,
} from './assessments';
import { assessments } from '@/db/schema';

interface Props {
  assessment: NonNullable<typeof assessments.$inferSelect>;
}

export default function AssessmentAuditHistoryModal({ assessment }: Props) {
  const [opened, { open, close }] = useDisclosure(false);

  const { data: auditHistory, isLoading } = useQuery({
    queryKey: ['assessmentAuditHistory', assessment.id],
    queryFn: () => getAssessmentAuditHistory(assessment.id),
    enabled: opened,
  });

  const getActionIcon = (action: 'create' | 'update' | 'delete') => {
    switch (action) {
      case 'create':
        return <IconPlus size={16} />;
      case 'update':
        return <IconEdit size={16} />;
      case 'delete':
        return <IconTrash size={16} />;
      default:
        return <IconEdit size={16} />;
    }
  };

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
      <Tooltip label='View Audit History'>
        <ActionIcon variant='subtle' color='gray' onClick={open}>
          <IconHistory size={16} />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group>
            <IconHistory size={20} />
            <Text fw={500}>
              Audit History:{' '}
              {getAssessmentNumberLabel(assessment.assessmentNumber)} -{' '}
              {getAssessmentTypeLabel(assessment.assessmentType)}
            </Text>
          </Group>
        }
        size='lg'
        centered
      >
        {isLoading ? (
          <Center py='xl'>
            <Loader size='md' variant='dots' />
          </Center>
        ) : !auditHistory || auditHistory.length === 0 ? (
          <Center py='xl'>
            <Stack align='center' gap='md'>
              <IconInfoCircle size={48} color='gray' />
              <Text c='dimmed' size='sm'>
                No audit history found for this assessment
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap='md'>
            <Alert
              icon={<IconInfoCircle size={16} />}
              title='Audit Trail'
              color='blue'
              variant='light'
            >
              <Text size='sm'>
                This shows the complete history of changes made to this
                assessment, including who made the changes and when.
              </Text>
            </Alert>

            <Timeline
              active={auditHistory.length}
              bulletSize={24}
              lineWidth={2}
            >
              {auditHistory.map((audit, index) => {
                const isLast = index === auditHistory.length - 1;
                const auditMessage = generateAssessmentAuditMessage(
                  audit.action,
                  {
                    previousAssessmentNumber: audit.previousAssessmentNumber,
                    newAssessmentNumber: audit.newAssessmentNumber,
                    previousAssessmentType: audit.previousAssessmentType,
                    newAssessmentType: audit.newAssessmentType,
                    previousTotalMarks: audit.previousTotalMarks,
                    newTotalMarks: audit.newTotalMarks,
                    previousWeight: audit.previousWeight,
                    newWeight: audit.newWeight,
                  },
                );
                return (
                  <Timeline.Item
                    key={audit.id}
                    bullet={getActionIcon(audit.action)}
                    title={
                      <Group gap='xs' mb={4}>
                        <Badge
                          color={getActionColor(audit.action)}
                          variant='light'
                          size='sm'
                        >
                          {audit.action.toUpperCase()}
                        </Badge>
                        <Text size='sm' c='dimmed'>
                          {formatDateTime(audit.date)}
                        </Text>
                      </Group>
                    }
                  >
                    <Stack gap='xs'>
                      <Text size='sm'>{auditMessage}</Text>
                      <Text size='xs' c='dimmed'>
                        By: {audit.createdByUser?.name || 'Unknown User'}
                      </Text>
                    </Stack>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </Stack>
        )}
      </Modal>
    </>
  );
}
