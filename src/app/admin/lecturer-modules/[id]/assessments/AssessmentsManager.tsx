'use client';

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
  Table,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconNotebook,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { deleteAssessment, getAssessments } from '@/server/assessments/actions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { showNotification } from '@mantine/notifications';
import AssessmentModal from './AssessmentModal';
import { modals } from '@mantine/modals';

type Props = {
  semesterModuleId: number;
  lecturesModuleId: number;
};

export default function AssessmentsManager({
  semesterModuleId,
  lecturesModuleId,
}: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['assessments', semesterModuleId],
    queryFn: async () => {
      const result = await getAssessments(1, '');
      return result.items;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assessments', semesterModuleId],
      });
      showNotification({
        title: 'Success',
        message: 'Assessment deleted successfully',
        color: 'green',
      });
    },
  });

  const openDeleteModal = (assessmentId: number, assessmentNumber: string) =>
    modals.openConfirmModal({
      title: 'Delete Assessment',
      centered: true,
      children: (
        <Text size='sm'>
          Are you sure you want to delete assessment {assessmentNumber}? This
          action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(assessmentId),
    });

  const assessments = data || [];

  return (
    <Card withBorder p='md' radius='md'>
      <Flex justify='space-between' align='center' mb='md'>
        <Title order={4} fw={500}>
          Assessments
        </Title>
        <AssessmentModal moduleId={semesterModuleId} mode='add'>
          <Button
            id='add-assessment'
            variant='outline'
            color='green'
            leftSection={<IconPlus size='1rem' />}
          >
            Add Assessment
          </Button>
        </AssessmentModal>
      </Flex>
      <Divider mb='md' />

      {isLoading ? (
        <Paper p='xl' withBorder>
          <Text c='dimmed' ta='center' size='sm'>
            Loading assessments...
          </Text>
        </Paper>
      ) : assessments.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <TableThead>
            <TableTr>
              <TableTh>Assessment</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Total Marks</TableTh>
              <TableTh>Weight</TableTh>
              <TableTh>Actions</TableTh>
            </TableTr>
          </TableThead>
          <Table.Tbody>
            {assessments.map((assessment) => (
              <Table.Tr key={assessment.id}>
                <Table.Td>
                  <Group gap='xs'>
                    <Text fw={500}>{assessment.assessmentNumber}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{assessment.assessmentType}</Table.Td>
                <Table.Td>{assessment.totalMarks}</Table.Td>
                <Table.Td>
                  <Badge color='blue'>{assessment.weight}%</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap='xs'>
                    <AssessmentModal
                      moduleId={semesterModuleId}
                      assessment={assessment}
                      mode='edit'
                    >
                      <Tooltip label='Edit assessment'>
                        <ActionIcon variant='light' color='blue'>
                          <IconEdit size='1rem' />
                        </ActionIcon>
                      </Tooltip>
                    </AssessmentModal>

                    <Tooltip label='Delete assessment'>
                      <ActionIcon
                        type='button'
                        variant='light'
                        color='red'
                        onClick={() =>
                          openDeleteModal(
                            assessment.id,
                            assessment.assessmentNumber,
                          )
                        }
                        loading={
                          deleteMutation.isPending &&
                          deleteMutation.variables === assessment.id
                        }
                      >
                        <IconTrash size='1rem' />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label='View gradebook for this assessment'>
                      <ActionIcon
                        variant='light'
                        color='green'
                        component={Link}
                        href={`/admin/lecturer-modules/${lecturesModuleId}/gradebook?assessmentId=${assessment.id}`}
                      >
                        <IconNotebook size='1rem' />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Paper p='xl' withBorder>
          <Stack align='center' gap='md'>
            <Text c='dimmed' ta='center' size='sm'>
              No assessments found for this module. Click "Add Assessment" to
              create your first assessment.
            </Text>
          </Stack>
        </Paper>
      )}
    </Card>
  );
}
