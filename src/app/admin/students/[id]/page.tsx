import { getStudent } from '@/server/students/actions';
import { notFound } from 'next/navigation';
import StudentView from './StudentView';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetails({ params }: Props) {
  const { id } = await params;
  const student = await getStudent(Number(id));

  if (!student) {
    return notFound();
  }

  return <StudentView student={student} />;
}
