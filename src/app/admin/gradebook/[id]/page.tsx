import { getAssignedModules } from '@/server/assigned-modules/actions';
import { Box, Container, Paper, Title, Divider } from '@mantine/core';
import { notFound } from 'next/navigation';
import StudentTable from './StudentTable';
import ModuleDetailsCard from './ModuleDetailsCard';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GradebookModuleView({ params }: Props) {
  const { id } = await params;
  const modules = await getAssignedModules(Number(id));

  if (!modules) {
    return notFound();
  }

  return (
    <Container size='xl' p='md'>
      <ModuleDetailsCard module={modules.semesterModule} />
      <Paper withBorder radius='md' shadow='sm' p='lg'>
        <Title order={4} fw={500} mb='md'>
          Student Gradebook
        </Title>
        <Divider mb='lg' />
        <Box>
          <StudentTable semesterModuleId={lecturesModule.semesterModule.id} />
        </Box>
      </Paper>
    </Container>
  );
}
