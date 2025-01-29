import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { getStudent } from '@/server/students/actions';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import StudentView from './StudentView';
import AcademicsView from './AcademicsView';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetails({ params }: Props) {
  const { id } = await params;
  const student = await getStudent(Number(id));

  if (!student) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader title={student.name} queryKey={['students']} />

      <Tabs defaultValue='academics' variant='outline' mt={'xl'}>
        <TabsList>
          <TabsTab value='academics'>Academics</TabsTab>
          <TabsTab value='info'>Student</TabsTab>
        </TabsList>
        <TabsPanel value='academics' pt={'xl'} p={'sm'}>
          <AcademicsView student={student} />
        </TabsPanel>
        <TabsPanel value='info' pt={'xl'} p={'sm'}>
          <StudentView student={student} />
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
