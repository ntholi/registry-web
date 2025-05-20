import { auth } from '@/auth';
import { getAssignedModuleByUserAndModule } from '@/server/assigned-modules/actions';
import { Container, Paper } from '@mantine/core';
import { notFound, unauthorized } from 'next/navigation';
import ModuleDetailsCard from './ModuleDetailsCard';
import StudentTable from './StudentTable';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GradebookModuleView({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const module = await getAssignedModuleByUserAndModule(
    session.user.id,
    Number(id),
  );

  if (!module) {
    return notFound();
  }

  return (
    <Container size='xl' p='md'>
      <ModuleDetailsCard module={module} />
      <Paper withBorder radius='md' shadow='sm' p='lg'>
        <StudentTable semesterModuleId={module.semesterModuleId} />
      </Paper>
    </Container>
  );
}
