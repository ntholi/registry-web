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
import Link from 'next/link';
import { deleteAssessment, getAssessments } from '@/server/assessments/actions';
import { useQuery } from '@tanstack/react-query';

type Props = {
  moduleId: number;
  lecturesModuleId: number;
};

export default function AssessmentsManager({
  moduleId,
  lecturesModuleId,
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['assessments', moduleId],
    queryFn: async () => {
      const result = await getAssessments(1, '');
      return result.items;
    },
  });

  const assessments = data || [];

  return (
    <Card withBorder p='md' radius='md'>
      <Flex justify='space-between' align='center' mb='md'>
        <Title order={4} fw={500}>
          Assessments
        </Title>
        <Button
          id='add-assessment'
          variant='outline'
          color='green'
          leftSection={<IconPlus size='1rem' />}
          component={Link}
          href={`/admin/assessments/new?moduleId=${moduleId}`}
        >
          Add Assessment
        </Button>
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
                    <Tooltip label='Edit assessment'>
                      <ActionIcon
                        variant='light'
                        color='blue'
                        component={Link}
                        href={`/admin/assessments/${assessment.id}/edit`}
                      >
                        <IconEdit size='1rem' />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label='Delete assessment'>
                      <form
                        action={async () => {
                          'use server';
                          await deleteAssessment(assessment.id);
                        }}
                      >
                        <ActionIcon type='submit' variant='light' color='red'>
                          <IconTrash size='1rem' />
                        </ActionIcon>
                      </form>
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
