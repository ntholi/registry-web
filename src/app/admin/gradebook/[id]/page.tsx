import { getLecturesModule } from '@/server/lecturer-modules/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { Box, Divider, Stack, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import StudentTable from './StudentTable';

type Props = {
  params: { id: string };
};

export default async function GradebookModuleView({ params }: Props) {
  const { id } = params;
  const lecturesModule = await getLecturesModule(Number(id));
  const currentTerm = await getCurrentTerm();

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
