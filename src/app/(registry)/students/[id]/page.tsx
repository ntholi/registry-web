import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { getBlockedStudentByStdNo } from '@/server/finance/blocked-students/actions';
import { getStudent } from '@/server/registry/students/actions';
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

	const blockedStudent = await getBlockedStudentByStdNo(student.stdNo);

	return (
		<DetailsView>
			<DetailsViewHeader title={student.name} queryKey={['students']} />
			<StudentTabs
				student={student}
				session={session}
				blockedStudent={blockedStudent}
			/>
		</DetailsView>
	);
}
