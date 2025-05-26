import { getAssignedModuleByUserAndModule } from '@/server/assigned-modules/actions';
import { Container, Paper } from '@mantine/core';
import { notFound } from 'next/navigation';
import ModuleDetailsCard from './ModuleDetailsCard';
import StudentTable from './StudentTable';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GradebookModuleView({ params }: Props) {
  const { id } = await params;

  const modules = await getAssignedModuleByUserAndModule(Number(id));

  if (!modules) {
    return notFound();
  }

  return (
    <Container size='xl' p='md'>
      <ModuleDetailsCard modules={modules} />
      <Paper withBorder radius='md' shadow='sm' p='lg'>
        <StudentTable moduleId={Number(id)} />
      </Paper>
    </Container>
  );
}
