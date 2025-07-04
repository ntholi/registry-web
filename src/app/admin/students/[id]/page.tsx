import { auth } from '@/auth';
import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { getStudent } from '@/server/students/actions';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudentTabs } from './StudentTabs';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const student = await getStudent(Number(id));

  return {
    title: `${student?.name} | Limkokwing`,
  };
}

export default async function StudentDetails({ params }: Props) {
  const { id } = await params;
  const student = await getStudent(Number(id));
  const session = await auth();

  if (!student) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader title={student.name} queryKey={['students']} />
      <StudentTabs student={student} session={session} />
    </DetailsView>
  );
}
