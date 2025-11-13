import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/core/auth';
import { getBlockedStudentByStdNo } from '@/modules/finance/features/blocked-students/server/actions';
import { StudentTabs } from '@/modules/registry/features/students/components/[id]/StudentTabs';
import { getStudent } from '@/modules/registry/features/students/server/actions';
import { DetailsView, DetailsViewHeader } from '@/shared/components/adease';

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
