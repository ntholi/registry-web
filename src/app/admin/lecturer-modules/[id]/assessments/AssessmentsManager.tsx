'use client';

import { getAssessmentBySemesterModuleId } from '@/server/assessments/actions';
import {
  ActionIcon,
  Button,
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import AssessmentModal from './AssessmentModal';
import { getAssessmentName } from '@/app/admin/assessments/options';
import DeleteAssessmentModal from './DeleteAssessmentModal';

type Props = {
  semesterModuleId: number;
};

export default function AssessmentsManager({ semesterModuleId }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['assessments', semesterModuleId],
    queryFn: async () => {
      return await getAssessmentBySemesterModuleId(semesterModuleId);
    },
  });

  const assessments = data || [];

  return (
    <Paper withBorder p='md' radius='md'>
      <Flex justify='space-between' align='center' mb='md'>
        <Title order={4} fw={500}>
          Assessments
        </Title>
        <AssessmentModal moduleId={semesterModuleId} mode='add'>
          <Button id='add-assessment' leftSection={<IconPlus size='1rem' />}>
            New
          </Button>
        </AssessmentModal>
      </Flex>

      {isLoading ? (
        <Paper p='xl' withBorder>
          <Text c='dimmed' ta='center' size='sm'>
            Loading assessments...
          </Text>
        </Paper>
      ) : assessments.length > 0 ? (
        <Table highlightOnHover withTableBorder>
          <TableThead>
            <TableTr>
              <TableTh>No</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Total Marks</TableTh>
              <TableTh>Weight</TableTh>
              <TableTh ta='right'>Actions</TableTh>
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
                <Table.Td>
                  {getAssessmentName(assessment.assessmentType)}
                </Table.Td>
                <Table.Td>{assessment.totalMarks}</Table.Td>
                <Table.Td>{assessment.weight}%</Table.Td>
                <Table.Td>
                  <Group gap='xs' justify='right'>
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

                    <DeleteAssessmentModal
                      assessment={assessment}
                      semesterModuleId={semesterModuleId}
                    >
                      <Tooltip label='Delete assessment'>
                        <ActionIcon type='button' variant='light' color='red'>
                          <IconTrash size='1rem' />
                        </ActionIcon>
                      </Tooltip>
                    </DeleteAssessmentModal>
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
              No assessments found for this module. Click &quot;New&quot; to
              create your first assessment.
            </Text>
          </Stack>
        </Paper>
      )}
    </Paper>
  );
}
