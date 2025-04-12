import { getLecturesModule } from '@/server/lecturer-modules/actions';
import { Box, Divider, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import StudentTable from './StudentTable';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GradebookModuleView({ params }: Props) {
  const { id } = await params;
  const lecturesModule = await getLecturesModule(Number(id));

  if (!lecturesModule) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Title order={3} fw={100}>
        {lecturesModule.semesterModule.name} (
        {lecturesModule.semesterModule.code})
      </Title>
      <Title order={5} fw={100} c={'dimmed'}>
        Gradebook
      </Title>
      <Divider my={'sm'} />
      <StudentTable semesterModuleId={lecturesModule.semesterModule.id} />
    </Box>
  );
}
