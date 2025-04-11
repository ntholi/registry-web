import {
  DetailsView,
  DetailsViewHeader,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import {
  getLecturesModule,
  deleteLecturesModule,
} from '@/server/lecturer-modules/actions';
import { getAssessments, deleteAssessment } from '@/server/assessments/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Grid,
  GridCol,
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
import { assessmentNumberEnum } from '@/db/schema';

type Props = {
  params: { id: string };
};

export default async function LecturesModuleDetails({ params }: Props) {
  const { id } = params;
  const lecturesModule = await getLecturesModule(Number(id));
  const currentTerm = await getCurrentTerm();

  if (!lecturesModule) {
    return notFound();
  }

  const allAssessments = await getAssessments(1, '');
  const moduleAssessments = allAssessments.items.slice(0, 5);

  const assessmentNumberOptions = assessmentNumberEnum.map((value) => ({
    value,
    label: value.replace('CW', 'Course Work '),
  }));

  return (
    <DetailsView>
      <DetailsViewHeader
        title={lecturesModule.semesterModule.name}
        queryKey={['lecturerModules']}
        handleDelete={async () => {
          'use server';
          await deleteLecturesModule(Number(id));
        }}
      />
      <DetailsViewBody>
        <Grid gutter='xl'>
          <GridCol span={12}>
            <Card withBorder p='md' radius='md'>
              <Stack>
                <Flex justify='space-between' align='center'>
                  <Title order={4} fw={500}>
                    Assessment Management
                  </Title>
                  <Button
                    variant='light'
                    color='blue'
                    component={Link}
                    href={`/admin/lecturer-modules/${id}/gradebook`}
                    leftSection={<IconNotebook size='1.2rem' />}
                  >
                    Gradebook
                  </Button>
                </Flex>
              </Stack>
            </Card>
          </GridCol>

          <GridCol span={12}>
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
                  href={`/admin/assessments/new?moduleId=${lecturesModule.semesterModuleId}`}
                >
                  Add Assessment
                </Button>
              </Flex>
              <Divider mb='md' />

              {moduleAssessments.length > 0 ? (
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
                    {moduleAssessments.map((assessment) => (
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
                                <ActionIcon
                                  type='submit'
                                  variant='light'
                                  color='red'
                                >
                                  <IconTrash size='1rem' />
                                </ActionIcon>
                              </form>
                            </Tooltip>
                            <Tooltip label='View gradebook for this assessment'>
                              <ActionIcon
                                variant='light'
                                color='green'
                                component={Link}
                                href={`/admin/lecturer-modules/${id}/gradebook?assessmentId=${assessment.id}`}
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
                      No assessments found for this module. Click "Add
                      Assessment" to create your first assessment.
                    </Text>
                  </Stack>
                </Paper>
              )}
            </Card>
          </GridCol>
        </Grid>
      </DetailsViewBody>
    </DetailsView>
  );
}
