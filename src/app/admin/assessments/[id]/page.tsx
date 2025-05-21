import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/components/adease';
import { deleteModule } from '@/server/modules/actions';
import { getModule } from '@/server/modules/actions';
import { notFound } from 'next/navigation';
import {
  Badge,
  Card,
  Divider,
  Grid,
  GridCol,
  Group,
  Paper,
  SimpleGrid,
  Table,
  Text,
  Title,
} from '@mantine/core';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
  const { id } = await params;
  const module = await getModule(Number(id));

  if (!module) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={`Module: ${module.code}`}
        queryKey={['modules']}
        handleDelete={async () => {
          'use server';
          await deleteModule(Number(id));
        }}
      />

      <Grid gutter='md'>
        <GridCol span={{ base: 12, md: 8 }}>
          <Paper p='md' radius='md' withBorder shadow='sm'>
            <Title order={4} mb='md'>
              Module Information
            </Title>
            <DetailsViewBody>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <FieldView label='Module Code'>{module.code}</FieldView>
                <FieldView label='Module Name'>{module.name}</FieldView>
                <FieldView label='Status'>
                  <Badge color={module.status === 'Active' ? 'green' : 'red'}>
                    {module.status}
                  </Badge>
                </FieldView>
                {module.timestamp && (
                  <FieldView label='Timestamp'>{module.timestamp}</FieldView>
                )}
              </SimpleGrid>
            </DetailsViewBody>
          </Paper>
        </GridCol>

        <GridCol span={{ base: 12, md: 4 }}>
          <Paper p='md' radius='md' withBorder shadow='sm' h='100%'>
            <Title order={4} mb='md'>
              Module Statistics
            </Title>
            <Group grow>
              <Card withBorder padding='lg' radius='md'>
                <Text ta='center' fz='lg' fw={500} mt='md'>
                  {module.assessments?.length || 0}
                </Text>
                <Text ta='center' fz='sm' c='dimmed'>
                  Total Assessments
                </Text>
              </Card>
            </Group>
          </Paper>
        </GridCol>

        <GridCol span={12}>
          <Paper p='md' radius='md' withBorder shadow='sm'>
            <Title order={4} mb='md'>
              Assessments
            </Title>
            {module.assessments && module.assessments.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Assessment Number</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Total Marks</Table.Th>
                    <Table.Th>Weight</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {module.assessments.map((assessment) => (
                    <Table.Tr key={assessment.id}>
                      <Table.Td>{assessment.assessmentNumber}</Table.Td>
                      <Table.Td>{assessment.assessmentType}</Table.Td>
                      <Table.Td>{assessment.totalMarks}</Table.Td>
                      <Table.Td>{assessment.weight}%</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c='dimmed' ta='center' py='xl'>
                No assessments found for this module
              </Text>
            )}
          </Paper>
        </GridCol>
      </Grid>
    </DetailsView>
  );
}
