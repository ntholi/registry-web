import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { getStudent } from '@/server/students/actions';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import StudentView from './StudentView';
import AcademicsView from './AcademicsView';
import RegistrationView from './RegistrationView';
import { getRegistrationRequestsByStudent } from '@/server/registration-requests/actions';
import { auth } from '@/auth';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetails({ params }: Props) {
  const { id } = await params;
  const student = await getStudent(Number(id));
  const session = await auth();

  if (!student) {
    return notFound();
  }

  const showRegistrationTab =
    session?.user?.role === 'admin' || session?.user?.role === 'finance';

  const registrationRequests = await getRegistrationRequestsByStudent(
    student.stdNo,
  );

  return (
    <DetailsView>
      <DetailsViewHeader title={student.name} queryKey={['students']} />

      <Tabs defaultValue='academics' variant='outline' mt={'xl'}>
        <TabsList>
          <TabsTab value='academics'>Academics</TabsTab>
          <TabsTab value='info'>Student</TabsTab>
          {showRegistrationTab && (
            <TabsTab value='registration'>Registration</TabsTab>
          )}
        </TabsList>
        <TabsPanel value='academics' pt={'xl'} p={'sm'}>
          <AcademicsView student={student} showMarks />
        </TabsPanel>
        <TabsPanel value='info' pt={'xl'} p={'sm'}>
          <StudentView student={student} />
        </TabsPanel>
        <TabsPanel value='registration' pt={'xl'} p={'sm'}>
          <RegistrationView registrationRequests={registrationRequests} />
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
