'use client';

import { ActionIcon, Button, Group, Paper, Table, Title, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { getModule } from '@/server/modules/actions';
import { deleteAssessment } from '@/server/assessments/actions';
import AssessmentModal from './AssessmentModal';

interface Props {
  module: NonNullable<Awaited<ReturnType<typeof getModule>>>;
}

export default function AssessmentsTable({ module }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedAssessment, setSelectedAssessment] = useState<NonNullable<Awaited<ReturnType<typeof getModule>>>['assessments'][0] | undefined>(undefined);
  const queryClient = useQueryClient();

  const handleAddAssessment = () => {
    setSelectedAssessment(undefined);
    open();
  };

  const handleEditAssessment = (assessment: NonNullable<Awaited<ReturnType<typeof getModule>>>['assessments'][0]) => {
    setSelectedAssessment(assessment);
    open();
  };

  const handleDeleteAssessment = async (id: number) => {
    try {
      await deleteAssessment(id);
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      notifications.show({
        title: 'Success',
        message: 'Assessment deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An error occurred while deleting the assessment',
        color: 'red',
      });
    }
  };

  return (
    <Paper p='md' radius='md' withBorder shadow='sm'>
      <Group justify="space-between" mb="md">
        <Title order={4} fw={400}>
          Assessments
        </Title>
        <Button 
          leftSection={<IconPlus size={16} />} 
          onClick={handleAddAssessment}
        >
          Add Assessment
        </Button>
      </Group>
      {module.assessments && module.assessments.length > 0 ? (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Assessment Number</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Total Marks</Table.Th>
              <Table.Th>Weight</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {module.assessments.map((assessment) => (
              <Table.Tr key={assessment.id}>
                <Table.Td>{assessment.assessmentNumber}</Table.Td>
                <Table.Td>{assessment.assessmentType}</Table.Td>
                <Table.Td>{assessment.totalMarks}</Table.Td>
                <Table.Td>{assessment.weight}%</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Edit">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEditAssessment(assessment)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteAssessment(assessment.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c='dimmed' ta='center' py='xl'>
          No assessments found for this module
        </Text>
      )}

      <AssessmentModal
        moduleId={module.id}
        assessment={selectedAssessment}
        opened={opened}
        onClose={close}
      />
    </Paper>
  );
}
